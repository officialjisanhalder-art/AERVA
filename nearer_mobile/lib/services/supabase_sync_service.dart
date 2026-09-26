import 'dart:async';
import 'dart:io';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/emergency_case.dart';
import '../models/emergency_visit_history.dart';

class SupabaseSyncService {
  static const String supabaseUrl = "https://oqjfknreyifhcdkucdnn.supabase.co";
  static const String supabaseAnonKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xamZrbnJleWlmaGNka3VjZG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3ODk5NDIsImV4cCI6MjEwNTM2NTk0Mn0.jEKfQo-q8CbZaQqbG5ZgUdo3J5xfzjh-Rg_OLpiI5g8";

  static bool _initialized = false;
  static RealtimeChannel? _emergencyChannel;
  static RealtimeChannel? _capacityChannel;
  static final Map<String, RealtimeChannel> _chatChannels = {};

  static bool get isConfigured => _initialized;
  static SupabaseClient get client => Supabase.instance.client;

  /// Initialize Supabase client
  static Future<void> init() async {
    if (_initialized) return;
    try {
      await Supabase.initialize(
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
        realtimeClientOptions: const RealtimeClientOptions(
          eventsPerSecond: 10,
        ),
      );
      _initialized = true;
      _setupChannels();
      debugPrint("✓ NearER Supabase Realtime Service connected successfully.");
    } catch (e) {
      debugPrint("⚠ Supabase initialize warning: $e");
    }
  }

  static void _setupChannels() {
    if (!_initialized) return;
    try {
      _emergencyChannel = client.channel(
        'nearer_live_emergency',
        opts: const RealtimeChannelConfig(self: true),
      );
      _emergencyChannel?.subscribe();

      _capacityChannel = client.channel(
        'nearer_hospital_capacity',
        opts: const RealtimeChannelConfig(self: true),
      );
      _capacityChannel?.subscribe();
    } catch (e) {
      debugPrint("Error creating realtime channels: $e");
    }
  }

  /// 1. Dispatch SOS Emergency Case to Supabase (Database + Realtime Broadcast)
  static Future<void> dispatchEmergencyCase(EmergencyCase emergency) async {
    if (!_initialized) return;
    try {
      // Read & encode audio file if voice brief was recorded
      String? audioDataUrl;
      if (emergency.voiceFilePath != null && emergency.voiceFilePath!.isNotEmpty) {
        try {
          final file = File(emergency.voiceFilePath!);
          if (await file.exists()) {
            final bytes = await file.readAsBytes();
            if (bytes.isNotEmpty) {
              final b64 = base64Encode(bytes);
              audioDataUrl = "data:audio/mp4;base64,$b64";
              debugPrint("✓ Encoded mobile voice note: ${bytes.length} bytes");
            }
          }
        } catch (e) {
          debugPrint("Error reading voice note file: $e");
        }
      }

      // Structure description with metadata, audio, and ambulance preference
      final Map<String, dynamic> descMap = {
        'text': emergency.writtenDescription.isNotEmpty
            ? emergency.writtenDescription
            : 'Mobile Emergency Intake',
        'ambulance_required': emergency.ambulanceRequired,
        'ambulance_dispatched': emergency.ambulanceDispatched,
      };
      if (audioDataUrl != null) {
        descMap['audio'] = audioDataUrl;
      }
      final descriptionPayload = jsonEncode(descMap);

      // Realtime Broadcast across Web Portals (keep broadcast lightweight)
      final payload = {
        'caseId': emergency.caseId,
        'patientName': emergency.patientName,
        'patientPhone': emergency.patientPhone,
        'patientAge': emergency.patientAge,
        'patientGender': emergency.patientGender,
        'bloodGroup': emergency.bloodGroup,
        'emergencyType': emergency.emergencyType,
        'status': emergency.status,
        'hospitalId': emergency.hospitalId,
        'ambulanceRequired': emergency.ambulanceRequired,
        'ambulanceDispatched': emergency.ambulanceDispatched,
        'location': {
          'lat': emergency.originLat,
          'lng': emergency.originLng,
          'area': emergency.locationArea,
          'city': emergency.locationCity,
        },
        'greenCorridorAlerted': emergency.greenCorridorAlerted,
        'assignedBed': emergency.assignedBedBay,
        'doctorInChargeName': emergency.doctorInChargeName,
        'transcript': emergency.writtenDescription,
        'hasVoiceBrief': audioDataUrl != null || emergency.hasVoiceBrief,
        'audioDataUrl': (audioDataUrl != null && audioDataUrl.length < 180000) ? audioDataUrl : null,
        'timestamp': emergency.createdAt.toIso8601String(),
      };

      try {
        await _emergencyChannel?.sendBroadcastMessage(
          event: 'emergency_event',
          payload: payload,
        );
      } catch (be) {
        debugPrint("Broadcast notice: $be");
      }

      // Persistent PostgreSQL Insert/Upsert (valid schema columns only)
      await client.from('emergency_requests').upsert({
        'case_id': emergency.caseId,
        'patient_name': emergency.patientName,
        'patient_mobile': emergency.patientPhone,
        'emergency_type': emergency.emergencyType,
        'description': descriptionPayload,
        'status': emergency.status,
        'selected_hospital_id': emergency.hospitalId,
        'origin_latitude': emergency.originLat,
        'origin_longitude': emergency.originLng,
        'origin_text': '${emergency.locationArea}, ${emergency.locationCity}',
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      }, onConflict: 'case_id');

      debugPrint("✓ Dispatched SOS for ${emergency.caseId} to Supabase!");
    } catch (e) {
      debugPrint("⚠ Dispatch emergency error: $e");
    }
  }

  /// 2. Subscribe to live updates for a specific Emergency Case
  static StreamSubscription? subscribeToEmergencyCase(
    String caseId,
    Function(Map<String, dynamic> data) onUpdate,
  ) {
    if (!_initialized) return null;
    StreamSubscription? streamSub;
    try {
      if (_emergencyChannel != null) {
        _emergencyChannel!.onBroadcast(
          event: 'emergency_event',
          callback: (payload) {
            if (payload['caseId'] == caseId) {
              onUpdate(Map<String, dynamic>.from(payload));
            }
          },
        );
      }

      // Fast 2-second database polling fallback: guarantees APK updates when hospital staff accept/reserve
      Timer.periodic(const Duration(seconds: 2), (timer) async {
        try {
          final row = await client
              .from('emergency_requests')
              .select('*')
              .eq('case_id', caseId)
              .maybeSingle();

          if (row != null) {
            final st = row['status']?.toString();
            if (st != null) {
              onUpdate({
                'caseId': row['case_id'],
                'status': st,
                'selected_hospital_id': row['selected_hospital_id'],
                'assignedBed': (st == 'ACCEPTED' || st == 'HOSPITAL_ACCEPTED' || st == 'CAPACITY_RESERVED')
                    ? 'Red Bay 01 (Reserved)'
                    : null,
              });
            }
          }
        } catch (_) {}
      });

      debugPrint("✓ Subscribed to Realtime Emergency Case with 2s polling: $caseId");
    } catch (e) {
      debugPrint("Error subscribing to emergency case: $e");
    }
    return streamSub;
  }

  /// 3. Broadcast status transition (e.g. ARRIVED, EN_ROUTE)
  static Future<void> updateCaseStatus({
    required String caseId,
    required String status,
    String? assignedBed,
    String? doctorInCharge,
    bool? greenCorridorAlerted,
  }) async {
    if (!_initialized) return;
    try {
      final payload = <String, dynamic>{
        'caseId': caseId,
        'status': status,
        'timestamp': DateTime.now().toUtc().toIso8601String(),
      };
      if (assignedBed != null) payload['assignedBed'] = assignedBed;
      if (doctorInCharge != null) payload['doctorInChargeName'] = doctorInCharge;
      if (greenCorridorAlerted != null) payload['greenCorridorAlerted'] = greenCorridorAlerted;

      await _emergencyChannel?.sendBroadcastMessage(
        event: 'emergency_event',
        payload: payload,
      );

      await client.from('emergency_requests').update({
        'status': status,
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      }).eq('case_id', caseId);

      debugPrint("✓ Status updated to $status for $caseId in Supabase!");
    } catch (e) {
      debugPrint("Error updating case status in Supabase: $e");
    }
  }

  /// 4. Subscribe to live hospital capacity & bed numbers
  static void subscribeToHospitalCapacity(
    Function(Map<String, dynamic> data) onCapacityUpdate,
  ) {
    if (!_initialized || _capacityChannel == null) return;
    try {
      _capacityChannel!.onBroadcast(
        event: 'capacity_update',
        callback: (payload) {
          onCapacityUpdate(Map<String, dynamic>.from(payload));
        },
      );
      debugPrint("✓ Subscribed to Realtime Hospital Capacity updates");
    } catch (e) {
      debugPrint("Error subscribing to capacity updates: $e");
    }
  }

  /// 5. Real-Time Chat: Send message
  static Future<void> sendChatMessage({
    required String caseId,
    required String sender,
    required String text,
    bool isVoice = false,
  }) async {
    if (!_initialized) return;
    try {
      final msgPayload = {
        'id': 'm_${DateTime.now().millisecondsSinceEpoch}',
        'caseId': caseId,
        'sender': sender,
        'text': text,
        'time': '${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}',
        'isVoice': isVoice,
      };

      // Broadcast on case channel
      RealtimeChannel? ch = _chatChannels[caseId];
      if (ch == null) {
        ch = client.channel('nearer_chat_$caseId', opts: const RealtimeChannelConfig(self: true));
        ch.subscribe();
        _chatChannels[caseId] = ch;
      }

      await ch.sendBroadcastMessage(
        event: 'new_message',
        payload: msgPayload,
      );

      // Save to database
      final caseQuery = await client.from('emergency_requests').select('id').eq('case_id', caseId).maybeSingle();
      if (caseQuery != null) {
        await client.from('emergency_messages').insert({
          'emergency_request_id': caseQuery['id'],
          'sender_type': sender.toUpperCase(),
          'sender_id': sender,
          'message_type': isVoice ? 'VOICE' : 'TEXT',
          'message_text': text,
          'created_at': DateTime.now().toUtc().toIso8601String(),
        });
      }
      debugPrint("✓ Realtime message sent for case $caseId");
    } catch (e) {
      debugPrint("Error sending realtime chat message: $e");
    }
  }

  /// 6. Real-Time Chat: Subscribe to incoming messages
  static void subscribeToChat(
    String caseId,
    Function(Map<String, dynamic> msg) onNewMessage,
  ) {
    if (!_initialized) return;
    try {
      RealtimeChannel? ch = _chatChannels[caseId];
      if (ch == null) {
        ch = client.channel('nearer_chat_$caseId', opts: const RealtimeChannelConfig(self: true));
        ch.subscribe();
        _chatChannels[caseId] = ch;
      }

      ch.onBroadcast(
        event: 'new_message',
        callback: (payload) {
          onNewMessage(Map<String, dynamic>.from(payload));
        },
      );
      debugPrint("✓ Subscribed to chat channel nearer_chat_$caseId");
    } catch (e) {
      debugPrint("Error subscribing to chat: $e");
    }
  }

  /// 7. Save Triage Handover Pass & Visit History to Supabase
  static Future<void> logArrivalHandover(EmergencyVisitHistory visit) async {
    if (!_initialized) return;
    try {
      // Broadcast arrival confirmed event
      await _emergencyChannel?.sendBroadcastMessage(
        event: 'emergency_event',
        payload: {
          'caseId': visit.caseId,
          'status': 'ARRIVED',
          'assignedBed': visit.triageBay,
          'doctorInChargeName': visit.doctorInChargeName,
          'timestamp': visit.timestamp,
        },
      );

      // Update emergency_requests to completed/arrived
      await client.from('emergency_requests').update({
        'status': 'ARRIVED',
        'completed_at': DateTime.now().toUtc().toIso8601String(),
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      }).eq('case_id', visit.caseId);

      debugPrint("✓ Logged arrival handover for ${visit.caseId} in Supabase!");
    } catch (e) {
      debugPrint("Error logging visit handover: $e");
    }
  }

  /// 8. Ambulance Fleet Realtime Subscription
  static void subscribeToAmbulance(Function(Map<String, dynamic> data) onUpdate) {
    if (!_initialized) return;
    try {
      _emergencyChannel?.onBroadcast(
        event: 'AMBULANCE_STATUS_UPDATED',
        callback: (payload) => onUpdate(Map<String, dynamic>.from(payload)),
      );
      _emergencyChannel?.onBroadcast(
        event: 'AMBULANCE_DISPATCHED',
        callback: (payload) => onUpdate(Map<String, dynamic>.from(payload)),
      );
      debugPrint("✓ Subscribed to ambulance fleet events on nearer_live_emergency");
    } catch (e) {
      debugPrint("Error subscribing to ambulance fleet: $e");
    }
  }

  /// 9. Dispatch ALS Ambulance Request Broadcast
  static Future<void> dispatchAmbulanceRequest({
    required String caseId,
    required String patientName,
    required String emergencyType,
    required double lat,
    required double lng,
  }) async {
    if (!_initialized) return;
    try {
      await _emergencyChannel?.sendBroadcastMessage(
        event: 'AMBULANCE_DISPATCH_REQUESTED',
        payload: {
          'case_id': caseId,
          'patient_name': patientName,
          'emergency_type': emergencyType,
          'lat': lat,
          'lng': lng,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
      debugPrint("✓ Broadcasted AMBULANCE_DISPATCH_REQUESTED for case $caseId");
    } catch (e) {
      debugPrint("Error dispatching ambulance request: $e");
    }
  }
}

