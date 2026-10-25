import 'dart:async';
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../theme/app_theme.dart';
import '../../models/emergency_case.dart';
import '../../services/storage_service.dart';
import '../../services/navigation_service.dart';
import '../../services/audio_service.dart';
import '../../services/i18n_service.dart';
import '../../models/emergency_visit_history.dart';
import '../patient_dashboard_screen.dart';
import '../splash_welcome_screen.dart';
import '../../services/supabase_sync_service.dart';
import 'ambulance_tracking_screen.dart';

class EmergencyStatusScreen extends StatefulWidget {
  final EmergencyCase emergencyCase;
  const EmergencyStatusScreen({super.key, required this.emergencyCase});

  @override
  State<EmergencyStatusScreen> createState() => _EmergencyStatusScreenState();
}

class _EmergencyStatusScreenState extends State<EmergencyStatusScreen> {
  late EmergencyCase _case;
  bool _isPlayingVoice = false;
  final _msgController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  Timer? _statusTimer;

  final List<String> _statusSequence = [
    "REQUEST_SENT",
    "HOSPITAL_REVIEWING",
    "HOSPITAL_ACCEPTED",
    "CAPACITY_RESERVED",
    "EN_ROUTE",
    "ARRIVED",
    "COMPLETED",
  ];

  @override
  void initState() {
    super.initState();
    _case = widget.emergencyCase;
    _simulateHospitalUpdates();

    // Supabase Real-Time Live Emergency Case Updates
    SupabaseSyncService.subscribeToEmergencyCase(_case.caseId, (data) {
      if (!mounted) return;
      final newStatus = data['status']?.toString();
      final corridor = data['greenCorridorAlerted'];
      final bed = data['assignedBed']?.toString();
      final docName = data['doctorInChargeName']?.toString();

      if (newStatus != null) {
        String mappedStatus = newStatus;
        if (newStatus == 'ACCEPTED') mappedStatus = 'HOSPITAL_ACCEPTED';
        if (newStatus == 'VERIFIED') mappedStatus = 'REQUEST_VERIFIED';

        setState(() {
          _case = _case.copyWith(
            status: mappedStatus,
            greenCorridorAlerted: corridor is bool ? corridor : _case.greenCorridorAlerted,
            assignedBedBay: bed ?? _case.assignedBedBay,
            doctorInChargeName: docName ?? _case.doctorInChargeName,
          );
        });

        if (mappedStatus == 'ARRIVED' || mappedStatus == 'COMPLETED' || mappedStatus == 'ADMITTED') {
          StorageService.clearActiveCase();
        } else {
          StorageService.saveActiveCase(_case);
        }
      }
    });

    // Supabase Real-Time Live Chat Messages
    SupabaseSyncService.subscribeToChat(_case.caseId, (data) {
      if (!mounted) return;
      final msgId = data['id']?.toString();
      final sender = data['sender']?.toString();
      final text = data['text']?.toString();
      final time = data['time']?.toString();

      if (text != null && !_case.messages.any((m) => m.id == msgId)) {
        final newMsg = EmergencyMessage(
          id: msgId ?? 'm_${DateTime.now().millisecondsSinceEpoch}',
          sender: sender ?? 'hospital',
          text: text,
          time: time ?? 'Just now',
        );
        setState(() {
          _case = _case.copyWith(messages: [..._case.messages, newMsg]);
        });
        StorageService.saveActiveCase(_case);
      }
    });

    // Supabase Real-Time Hospital Capacity & Bed Updates
    SupabaseSyncService.subscribeToHospitalCapacity((data) {
      if (!mounted) return;
      final hospId = data['hospitalId']?.toString();
      final erBeds = data['erBedsAvailable'];
      final targetHospId = _case.hospitalId;
      final isMatch = hospId == targetHospId ||
          (hospId == 'h2' && targetHospId == 'h2_amri') ||
          (hospId == 'h2_amri' && targetHospId == 'h2');
      if (isMatch && erBeds is num) {
        setState(() {
          _case = _case.copyWith(erBedsAvailable: erBeds.toInt());
        });
        StorageService.saveActiveCase(_case);
      }
    });
  }

  @override
  void dispose() {
    _statusTimer?.cancel();
    _msgController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // Hospital Response Lifecycle Simulation (Fallback if hospital desk is offline)
  void _simulateHospitalUpdates() {
    if (_case.status == "REQUEST_SENT") {
      _statusTimer = Timer(const Duration(seconds: 6), () {
        if (!mounted || _case.status != "REQUEST_SENT") return;
        _updateStatus("HOSPITAL_REVIEWING", "Chief ER Registrar is reviewing clinical vitals with ${_case.doctorInChargeName}.");
        _statusTimer = Timer(const Duration(seconds: 5), () {
          if (!mounted || (_case.status != "REQUEST_SENT" && _case.status != "HOSPITAL_REVIEWING")) return;
          _updateStatus(
            "HOSPITAL_ACCEPTED",
            "Emergency Accepted by ${_case.doctorInChargeName}. Triage Bay #02 prepared. Green corridor requested from Traffic Police.",
            greenCorridor: true,
          );
        });
      });
    }
  }

  Future<void> _updateStatus(String newStatus, String hospitalNote, {bool? greenCorridor, int? bedsLeft}) async {
    final newMsg = EmergencyMessage(
      id: "m_${DateTime.now().millisecondsSinceEpoch}",
      sender: "hospital",
      text: hospitalNote,
      time: "${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}",
    );

    final updated = _case.copyWith(
      status: newStatus,
      messages: [..._case.messages, newMsg],
      greenCorridorAlerted: greenCorridor ?? _case.greenCorridorAlerted,
      erBedsAvailable: bedsLeft ?? _case.erBedsAvailable,
    );

    await StorageService.saveActiveCase(updated);
    if (mounted) {
      setState(() => _case = updated);
    }
  }

  Future<void> _sendMessage() async {
    final text = _msgController.text.trim();
    if (text.isEmpty) return;

    final newMsg = EmergencyMessage(
      id: "m_${DateTime.now().millisecondsSinceEpoch}",
      sender: "patient",
      text: text,
      time: "${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}",
    );

    final updated = _case.copyWith(
      messages: [..._case.messages, newMsg],
    );

    await StorageService.saveActiveCase(updated);
    _msgController.clear();
    setState(() => _case = updated);

    // Realtime Supabase Chat broadcast & database save
    await SupabaseSyncService.sendChatMessage(
      caseId: _case.caseId,
      sender: "patient",
      text: text,
    );

    // Auto-scroll chat
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  // Navigation Confirmation & Launch (PRD Section 23, 24, 25, 26)
  void _confirmAndLaunchNavigation() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text("READY TO NAVIGATE", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _navRow("From:", "${_case.locationArea}, ${_case.locationCity}"),
            const SizedBox(height: 8),
            _navRow("To:", _case.hospitalName),
            const SizedBox(height: 8),
            _navRow("Distance:", "${_case.distanceKm} km"),
            const SizedBox(height: 8),
            _navRow("Estimated ETA:", "${_case.etaMinutes} mins"),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: const Color(0xFFEEF3FF), borderRadius: BorderRadius.circular(10)),
              child: const Text(
                "NearER will remain open in background with active emergency case protection.",
                style: TextStyle(fontSize: 11, color: AppTheme.primary, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel")),
          ElevatedButton.icon(
            onPressed: () async {
              Navigator.pop(ctx);
              _updateStatus("EN_ROUTE", "Patient en route via Google Maps navigation.");
              await NavigationService.launchGoogleMaps(
                destLat: _case.hospitalLat,
                destLng: _case.hospitalLng,
                originLat: _case.originLat,
                originLng: _case.originLng,
                hospitalName: _case.hospitalName,
              );
            },
            icon: const Icon(Icons.navigation, size: 16),
            label: const Text("OPEN GOOGLE MAPS"),
          ),
        ],
      ),
    );
  }

  Widget _navRow(String label, String val) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(width: 90, child: Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF64748B)))),
        Expanded(child: Text(val, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: AppTheme.darkNavy))),
      ],
    );
  }

  // QR Pass Modal (PRD Section 20)
  void _showQrPass() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(color: AppTheme.primary, borderRadius: BorderRadius.circular(8)),
                child: const Text("NEARER EMERGENCY PASS", style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900)),
              ),
              const SizedBox(height: 16),
              Text(_case.patientName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
              Text("Case ID: ${_case.caseId}", style: const TextStyle(fontSize: 13, fontFamily: "monospace", color: Color(0xFF64748B), fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE2E8F0))),
                child: QrImageView(
                  data: "https://aerva-0cvq.onrender.com/pass/${_case.caseId}",
                  version: QrVersions.auto,
                  size: 180.0,
                ),
              ),
              const SizedBox(height: 14),
              Text("Assigned to ${_case.hospitalName}", style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text("Present this QR at ER triage for zero-delay admission.", textAlign: TextAlign.center, style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Close")),
        ],
      ),
    );
  }

  void _showGreenCorridorModal() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(color: Color(0xFF059669), shape: BoxShape.circle),
              child: const Icon(Icons.traffic, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 8),
            const Expanded(
              child: Text(
                "GREEN CORRIDOR DETAILS",
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _corridorRow("Origin Area:", "${_case.locationArea}, ${_case.locationCity}"),
              _corridorRow("Target ER:", _case.hospitalName),
              _corridorRow("Traffic HQ:", "Kolkata Traffic Control Room (Sector V Desk)"),
              _corridorRow("Signal Synchronization:", "ACTIVE (Priority Green Wave)", isHighlight: true),
              _corridorRow("Assigned Doctor:", _case.doctorInChargeName),
              _corridorRow("Bed Lock:", "1 Bed in Triage Red Bay Reserved"),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: const Text(
                  "Signals along your transit corridor are synchronized with emergency priority. Traffic police control room is monitoring passage.",
                  style: TextStyle(fontSize: 11, color: Color(0xFF065F46), fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Close")),
        ],
      ),
    );
  }

  Widget _corridorRow(String label, String val, {bool isHighlight = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 105, child: Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w600))),
          Expanded(
            child: Text(
              val,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: isHighlight ? const Color(0xFF059669) : const Color(0xFF0F172A),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _requestEmergencyAmbulance() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.emergency, color: AppTheme.primary),
            SizedBox(width: 8),
            Text("REQUEST ALS AMBULANCE", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
          ],
        ),
        content: Text(
          "Dispatch an Advanced Life Support (ALS) Mobile ICU ambulance to your coordinates (${_case.locationArea}, ${_case.locationCity})?",
          style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text("CANCEL"),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text("DISPATCH NOW"),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final updated = _case.copyWith(
      ambulanceRequired: true,
      ambulanceDispatched: true,
      messages: [
        ..._case.messages,
        EmergencyMessage(
          id: "m_${DateTime.now().millisecondsSinceEpoch}",
          sender: "patient",
          text: "Patient requested urgent ALS ambulance dispatch to live GPS coordinates.",
          time: "${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}",
        ),
        EmergencyMessage(
          id: "m_${DateTime.now().millisecondsSinceEpoch + 1}",
          sender: "hospital",
          text: "ALS Mobile ICU unit AMB-101 dispatched to your coordinates. Paramedic crew en route.",
          time: "${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}",
        ),
      ],
    );

    await StorageService.saveActiveCase(updated);
    await SupabaseSyncService.dispatchAmbulanceRequest(
      caseId: _case.caseId,
      patientName: _case.patientName,
      emergencyType: _case.emergencyType,
      lat: _case.originLat,
      lng: _case.originLng,
    );

    if (mounted) {
      setState(() => _case = updated);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("✓ ALS Mobile ICU Dispatched to your location!"),
          backgroundColor: Color(0xFF059669),
        ),
      );
    }
  }

  void _markArrival() async {
    final now = DateTime.now();
    final months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    final formattedTime = "${now.day} ${months[now.month - 1]} ${now.year}, ${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}";

    final historyItem = EmergencyVisitHistory(
      id: "hist_${DateTime.now().millisecondsSinceEpoch}",
      caseId: _case.caseId,
      timestamp: formattedTime,
      hospitalName: _case.hospitalName,
      hospitalAddress: "${_case.locationArea}, ${_case.locationCity}",
      emergencyType: "${_case.emergencyType} Emergency",
      doctorInChargeName: _case.doctorInChargeName,
      doctorInChargeRole: _case.doctorInChargeRole,
      status: "ADMITTED",
      triageBay: "Red Bay 01 (Immediate Critical Care)",
      greenCorridorUsed: _case.greenCorridorAlerted,
      distanceKm: _case.distanceKm,
      etaMinutes: _case.etaMinutes,
    );

    await StorageService.saveVisitHistory(historyItem);
    await StorageService.clearActiveCase();

    // Supabase Live Cloud Sync: Handover Log & Status Update
    await SupabaseSyncService.logArrivalHandover(historyItem);
    await SupabaseSyncService.updateCaseStatus(caseId: _case.caseId, status: 'ARRIVED');

    if (mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(color: Color(0xFF059669), shape: BoxShape.circle),
                child: const Icon(Icons.check, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  "ARRIVAL CONFIRMED",
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                ),
              ),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFECFDF5),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFA7F3D0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "ER Triage Handover Complete",
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF065F46)),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Patient successfully admitted to ${_case.hospitalName}.",
                        style: const TextStyle(fontSize: 12, color: Color(0xFF047857)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                _corridorRow("Case ID:", _case.caseId),
                _corridorRow("Doctor in Charge:", _case.doctorInChargeName),
                _corridorRow("Bed Assigned:", "Triage Red Bay 01 (Locked)", isHighlight: true),
                _corridorRow("Corridor Status:", _case.greenCorridorAlerted ? "Green Wave Cleared" : "Direct Transit"),
                const SizedBox(height: 10),
                const Text(
                  "This emergency visit has been permanently recorded in your Health Passport Care History and Hospital Admissions Log.",
                  style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const SplashWelcomeScreen()),
                  (route) => false,
                );
              },
              child: const Text("Home"),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const PatientDashboardScreen(initialTab: 4)),
                  (route) => false,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text("VIEW CARE HISTORY →", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11)),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: I18nService.currentLang,
      builder: (context, lang, _) {
        return WillPopScope(
          onWillPop: () async {
            // Active Case Protection (PRD Section 12)
            // Back button returns to home while preserving active case!
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (_) => const SplashWelcomeScreen()),
              (route) => false,
            );
            return false;
          },
          child: Scaffold(
            backgroundColor: const Color(0xFFF8FAFC),
            appBar: AppBar(
              title: Text("Case: ${_case.caseId}"),
              leading: IconButton(
                icon: const Icon(Icons.home, size: 20),
                tooltip: "Home (Case Persists)",
                onPressed: () {
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (_) => const SplashWelcomeScreen()),
                    (route) => false,
                  );
                },
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    I18nService.toggleLanguage();
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF3FF),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
                    ),
                    child: Text(
                      I18nService.t('lang.toggle'),
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primary),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.qr_code_2),
                  tooltip: "Emergency Pass QR",
                  onPressed: _showQrPass,
                ),
              ],
            ),
            body: SafeArea(
              child: Column(
                children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // EMERGENCY SNAPSHOT (PRD Section 35)
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text("CASE ${_case.caseId}", style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: AppTheme.primary, fontFamily: "monospace")),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(color: const Color(0xFFECFDF5), borderRadius: BorderRadius.circular(6)),
                                  child: Text(_case.status.replaceAll('_', ' '), style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.w900, fontSize: 10)),
                                ),
                              ],
                            ),
                            const Divider(height: 20),
                            Row(
                              children: [
                                Expanded(child: _snapItem("PATIENT", _case.patientName)),
                                Expanded(child: _snapItem("EMERGENCY", _case.emergencyType)),
                                Expanded(child: _snapItem("BLOOD", _case.bloodGroup)),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(child: _snapItem("DESTINATION", _case.hospitalName)),
                                Expanded(child: _snapItem("ETA", "${_case.etaMinutes} mins")),
                                Expanded(child: _snapItem("PATIENTS", "${_case.patientCount}")),
                              ],
                            ),
                            if (_case.hasVoiceBrief && _case.voiceFilePath != null) ...[
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(color: const Color(0xFFEEF3FF), borderRadius: BorderRadius.circular(10)),
                                child: Row(
                                  children: [
                                    IconButton(
                                      icon: Icon(_isPlayingVoice ? Icons.pause : Icons.play_arrow, color: AppTheme.primary),
                                      onPressed: () async {
                                        if (_isPlayingVoice) {
                                          await AudioService.pauseAudio();
                                          setState(() => _isPlayingVoice = false);
                                        } else {
                                          setState(() => _isPlayingVoice = true);
                                          await AudioService.playAudio(_case.voiceFilePath!);
                                        }
                                      },
                                    ),
                                    const Expanded(
                                      child: Text(
                                        "Emergency Voice Brief Attached",
                                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.primary),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),

                      // DOCTOR IN CHARGE & BED RESERVATION CARD
                      Container(
                        margin: const EdgeInsets.only(top: 12),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEEF3FF),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFD0E1FD)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.person_pin, color: AppTheme.primary, size: 24),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    I18nService.t('emergency.doctorInCharge').toUpperCase(),
                                    style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF64748B)),
                                  ),
                                  Text(
                                    "${_case.doctorInChargeName} • ${_case.doctorInChargeRole}",
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF050B18)),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    "ER Beds: ${_case.erBedsAvailable} Available (1 Bed Reserved for You)",
                                    style: const TextStyle(fontSize: 11, color: Color(0xFF059669), fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      // GREEN CORRIDOR / TRAFFIC POLICE ACTIVE ALERT
                      if (_case.greenCorridorAlerted || _case.status == "HOSPITAL_ACCEPTED" || _case.status == "CAPACITY_RESERVED" || _case.status == "EN_ROUTE")
                        Container(
                          margin: const EdgeInsets.only(top: 10),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFA7F3D0), width: 1.5),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: const BoxDecoration(
                                  color: Color(0xFF059669),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.traffic, color: Colors.white, size: 18),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      I18nService.t('emergency.greenCorridor'),
                                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Color(0xFF065F46)),
                                    ),
                                    Text(
                                      I18nService.t('emergency.greenCorridorDesc'),
                                      style: const TextStyle(fontSize: 10, color: Color(0xFF047857)),
                                    ),
                                  ],
                                ),
                              ),
                              TextButton(
                                onPressed: _showGreenCorridorModal,
                                style: TextButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  minimumSize: Size.zero,
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                child: const Text(
                                  "Details",
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                                ),
                              ),
                            ],
                          ),
                        ),

                      const SizedBox(height: 14),

                      // AMBULANCE / SELF-TRANSPORT TRANSIT CARD
                      if (_case.ambulanceRequired)
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                            ),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFF334155)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.15),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF0052FF).withOpacity(0.2),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.emergency, color: Color(0xFF60A5FA), size: 20),
                                  ),
                                  const SizedBox(width: 10),
                                  const Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          "NEARER ALS AMBULANCE",
                                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 0.8),
                                        ),
                                        SizedBox(height: 2),
                                        Text(
                                          "AMB-101 • Mobile ICU Escort",
                                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Colors.white),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF059669).withOpacity(0.25),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: const Color(0xFF10B981)),
                                    ),
                                    child: const Text(
                                      "ETA 6 MINS",
                                      style: TextStyle(color: Color(0xFF34D399), fontWeight: FontWeight.w900, fontSize: 10),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              const Text(
                                "Advanced Life Support unit en route with transport ventilator, defibrillator & ALS paramedic crew to your location.",
                                style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8), height: 1.3),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      onPressed: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) => AmbulanceTrackingScreen(emergencyCase: _case),
                                          ),
                                        );
                                      },
                                      icon: const Icon(Icons.radar, size: 16),
                                      label: const FittedBox(
                                        fit: BoxFit.scaleDown,
                                        child: Text(
                                          "TRACK LIVE AMBULANCE",
                                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 0.5),
                                        ),
                                      ),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFF0052FF),
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  OutlinedButton.icon(
                                    onPressed: () => NavigationService.callHospital("+919831188221"),
                                    icon: const Icon(Icons.phone, size: 14, color: Color(0xFF34D399)),
                                    label: const Text(
                                      "CALL DRIVER",
                                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Colors.white),
                                    ),
                                    style: OutlinedButton.styleFrom(
                                      side: const BorderSide(color: Color(0xFF334155)),
                                      backgroundColor: const Color(0xFF1E293B),
                                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        )
                      else
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                            ),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFF334155)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.15),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF059669).withOpacity(0.2),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.directions_car, color: Color(0xFF34D399), size: 20),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          "PATIENT SELF-TRANSPORT",
                                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 0.8),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          "Travelling Independently to ${_case.hospitalName}",
                                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Colors.white),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF059669).withOpacity(0.25),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: const Color(0xFF10B981)),
                                    ),
                                    child: const Text(
                                      "DIRECT ER ENTRY",
                                      style: TextStyle(color: Color(0xFF34D399), fontWeight: FontWeight.w900, fontSize: 10),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              const Text(
                                "Triage desk alerted for direct arrival. Turn-by-turn navigation guided to trauma emergency entrance.",
                                style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8), height: 1.3),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      onPressed: _confirmAndLaunchNavigation,
                                      icon: const Icon(Icons.navigation, size: 16),
                                      label: const FittedBox(
                                        fit: BoxFit.scaleDown,
                                        child: Text(
                                          "START TURN-BY-TURN ROUTE",
                                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 0.5),
                                        ),
                                      ),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFF0052FF),
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  OutlinedButton.icon(
                                    onPressed: _requestEmergencyAmbulance,
                                    icon: const Icon(Icons.emergency, size: 14, color: Color(0xFF60A5FA)),
                                    label: const Text(
                                      "NEED AMBULANCE",
                                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Colors.white),
                                    ),
                                    style: OutlinedButton.styleFrom(
                                      side: const BorderSide(color: AppTheme.primary),
                                      backgroundColor: const Color(0xFF0052FF).withOpacity(0.2),
                                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                      const SizedBox(height: 16),

                      // NAVIGATION & CALL BUTTONS
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _confirmAndLaunchNavigation,
                              icon: const Icon(Icons.navigation, size: 16),
                              label: const FittedBox(
                                fit: BoxFit.scaleDown,
                                child: Text("GOOGLE MAPS", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => NavigationService.callHospital(_case.hospitalPhone),
                              icon: const Icon(Icons.phone, size: 16),
                              label: const FittedBox(
                                fit: BoxFit.scaleDown,
                                child: Text("CALL HOSPITAL", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                              ),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // STATUS STEPPER (PRD Section 18)
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFE2E8F0))),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text("EMERGENCY CASE LIFECYCLE", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 1)),
                            const SizedBox(height: 12),
                            ...List.generate(_statusSequence.length, (idx) {
                              final currentIdx = _statusSequence.indexOf(_case.status);
                              final isDone = idx <= currentIdx;
                              final isCurrent = idx == currentIdx;
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 20,
                                      height: 20,
                                      decoration: BoxDecoration(
                                        color: isDone ? const Color(0xFF059669) : const Color(0xFFF1F5F9),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Center(
                                        child: isDone
                                            ? const Icon(Icons.check, size: 12, color: Colors.white)
                                            : null,
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        _statusSequence[idx].replaceAll('_', ' '),
                                        style: TextStyle(
                                          fontWeight: isCurrent ? FontWeight.w900 : FontWeight.w600,
                                          fontSize: 12,
                                          color: isCurrent ? AppTheme.darkNavy : (isDone ? const Color(0xFF059669) : const Color(0xFF94A3B8)),
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // CASE MESSAGES (PRD Section 22)
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFE2E8F0))),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text("HOSPITAL TRIAGE DISPATCH MESSAGES", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 1)),
                            const SizedBox(height: 10),
                            ..._case.messages.map((m) => Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: m.sender == "hospital" ? const Color(0xFFEEF3FF) : const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        m.sender == "hospital" ? "🏥 ER Triage Team" : "👤 Patient",
                                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: m.sender == "hospital" ? AppTheme.primary : const Color(0xFF64748B)),
                                      ),
                                      Text(m.time, style: const TextStyle(fontSize: 9, color: Color(0xFF94A3B8))),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(m.text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            )),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: _msgController,
                                    decoration: InputDecoration(
                                      hintText: "Send update to hospital triage...",
                                      hintStyle: const TextStyle(fontSize: 12),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                IconButton(
                                  icon: const Icon(Icons.send, color: AppTheme.primary),
                                  onPressed: _sendMessage,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Bottom Confirmation Bar
              Container(
                padding: const EdgeInsets.all(16),
                color: Colors.white,
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _markArrival,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.check_circle_outline, size: 20),
                        const SizedBox(width: 8),
                        Flexible(
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              lang == 'hi' ? "मैं अस्पताल पहुंच गया हूं (पुष्टि करें)" : "I HAVE REACHED THE HOSPITAL",
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.5),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  },
);
}

  Widget _snapItem(String label, String val) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8))),
        const SizedBox(height: 2),
        Text(val, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.darkNavy), overflow: TextOverflow.ellipsis),
      ],
    );
  }
}
