import 'dart:async';
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../models/patient_profile.dart';
import '../../services/location_service.dart';
import '../../services/storage_service.dart';
import '../../services/audio_service.dart';
import '../../services/i18n_service.dart';
import 'decision_analysis_screen.dart';

class EmergencyIntakeScreen extends StatefulWidget {
  final LocationResult location;
  const EmergencyIntakeScreen({super.key, required this.location});

  @override
  State<EmergencyIntakeScreen> createState() => _EmergencyIntakeScreenState();
}

class _EmergencyIntakeScreenState extends State<EmergencyIntakeScreen> {
  String _selectedEmergency = "Cardiac";
  int _patientCount = 1;
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _descController = TextEditingController();
  String _bloodGroup = "O+";
  String _age = "28";
  String _gender = "Male";
  bool _ambulanceRequired = true;

  // Voice recording states
  bool _isRecording = false;
  bool _isPlaying = false;
  String? _recordedAudioPath;
  int _recordingSeconds = 0;
  Timer? _recordTimer;

  final List<String> _emergencyTypes = [
    "Cardiac",
    "Trauma",
    "Stroke",
    "Severe Bleeding",
    "Burns",
    "Breathing Emergency",
    "Other",
  ];

  @override
  void initState() {
    super.initState();
    _prefillFromProfile();
  }

  Future<void> _prefillFromProfile() async {
    final profile = await StorageService.getProfile();
    final draft = await StorageService.getDraft();

    setState(() {
      _nameController.text = draft?['patientName'] ?? profile.fullName;
      _phoneController.text = draft?['patientPhone'] ?? profile.phone;
      _descController.text = draft?['writtenDescription'] ?? "";
      _selectedEmergency = draft?['emergencyType'] ?? "Cardiac";
      _patientCount = draft?['patientCount'] ?? 1;
      _bloodGroup = profile.bloodGroup;
      _age = profile.age;
      _gender = profile.gender;
      _ambulanceRequired = draft?['ambulanceRequired'] ?? true;
      if (draft?['voiceFilePath'] != null) {
        _recordedAudioPath = draft!['voiceFilePath'];
      }
    });
  }

  @override
  void dispose() {
    _recordTimer?.cancel();
    _nameController.dispose();
    _phoneController.dispose();
    _descController.dispose();
    super.dispose();
  }

  // Voice recording methods (PRD Section 8)
  Future<void> _startRecording() async {
    final path = await AudioService.startRecording();
    if (path != null) {
      setState(() {
        _isRecording = true;
        _recordingSeconds = 0;
        _recordedAudioPath = path;
      });
      _recordTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() => _recordingSeconds++);
      });
    }
  }

  Future<void> _stopRecording() async {
    _recordTimer?.cancel();
    final path = await AudioService.stopRecording();
    setState(() {
      _isRecording = false;
      if (path != null) _recordedAudioPath = path;
    });
  }

  Future<void> _togglePlayback() async {
    if (_recordedAudioPath == null) return;
    if (_isPlaying) {
      await AudioService.pauseAudio();
      setState(() => _isPlaying = false);
    } else {
      setState(() => _isPlaying = true);
      await AudioService.playAudio(_recordedAudioPath!);
      AudioService.playerStateStream.listen((state) {
        if (mounted && state.toString().contains("completed")) {
          setState(() => _isPlaying = false);
        }
      });
    }
  }

  void _deleteRecording() {
    AudioService.stopAudio();
    setState(() {
      _recordedAudioPath = null;
      _isPlaying = false;
      _recordingSeconds = 0;
    });
  }

  // Back Button Logic with exit confirmation (PRD Section 11)
  Future<bool> _onWillPop() async {
    final shouldLeave = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text("LEAVE EMERGENCY REQUEST?", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
        content: const Text(
          "Your current emergency information will be cleared.",
          style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text("CONTINUE", style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0A2540)),
            onPressed: () async {
              await StorageService.clearDraft();
              Navigator.pop(ctx, true);
            },
            child: const Text("LEAVE & CLEAR"),
          ),
        ],
      ),
    );
    return shouldLeave ?? false;
  }

  void _proceedToDecisionEngine() async {
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please enter Patient Name"), backgroundColor: Color(0xFF0A2540)),
      );
      return;
    }
    if (_phoneController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please enter a Contact Mobile Number"), backgroundColor: Color(0xFF0A2540)),
      );
      return;
    }

    final draftData = {
      'emergencyType': _selectedEmergency,
      'patientCount': _patientCount,
      'patientName': _nameController.text.trim(),
      'patientPhone': _phoneController.text.trim(),
      'writtenDescription': _descController.text.trim(),
      'bloodGroup': _bloodGroup,
      'patientAge': _age,
      'patientGender': _gender,
      'locationArea': widget.location.area,
      'locationCity': widget.location.city,
      'originLat': widget.location.lat,
      'originLng': widget.location.lng,
      'hasVoiceBrief': _recordedAudioPath != null,
      'voiceFilePath': _recordedAudioPath,
      'recordingDuration': _recordingSeconds,
      'ambulanceRequired': _ambulanceRequired,
    };

    await StorageService.saveDraft(draftData);

    if (mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => DecisionAnalysisScreen(
            location: widget.location,
            draftData: draftData,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          title: const Text("Emergency Triage Details"),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, size: 18),
            onPressed: () async {
              if (await _onWillPop()) {
                if (mounted) Navigator.pop(context);
              }
            },
          ),
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. WHAT IS THE EMERGENCY? (PRD Section 6)
                const Text(
                  "WHAT IS THE EMERGENCY?",
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 1),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _emergencyTypes.map((type) {
                    final isSel = _selectedEmergency == type;
                    return ChoiceChip(
                      label: Text(type),
                      selected: isSel,
                      onSelected: (_) => setState(() => _selectedEmergency = type),
                      selectedColor: AppTheme.primary,
                      backgroundColor: Colors.white,
                      labelStyle: TextStyle(
                        color: isSel ? Colors.white : AppTheme.darkNavy,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: isSel ? AppTheme.primary : const Color(0xFFE2E8F0)),
                      ),
                    );
                  }).toList(),
                ),

                const SizedBox(height: 24),

                // 2. PATIENT DETAILS (PRD Section 7)
                const Text(
                  "PATIENT DETAILS",
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 1),
                ),
                const SizedBox(height: 10),
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
                      TextField(
                        controller: _nameController,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        decoration: const InputDecoration(
                          labelText: "Patient Full Name *",
                          prefixIcon: Icon(Icons.person, size: 20),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        decoration: const InputDecoration(
                          labelText: "Mobile Number *",
                          prefixIcon: Icon(Icons.phone, size: 20),
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Number of Patients (1, 2, 3, 4, 5+)
                      const Text(
                        "NUMBER OF PATIENTS",
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF64748B)),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [1, 2, 3, 4, 5].map((count) {
                          final isSel = _patientCount == count;
                          return Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _patientCount = count),
                              child: Container(
                                margin: const EdgeInsets.symmetric(horizontal: 3),
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  color: isSel ? AppTheme.primary : const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Center(
                                  child: Text(
                                    count == 5 ? "5+" : "$count",
                                    style: TextStyle(
                                      color: isSel ? Colors.white : AppTheme.darkNavy,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // 3. ORIGINAL VOICE NOTE (PRD Section 8)
                const Text(
                  "ORIGINAL VOICE NOTE",
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 1),
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      if (_recordedAudioPath == null && !_isRecording) ...[
                        const Icon(Icons.mic_none, size: 36, color: Color(0xFF94A3B8)),
                        const SizedBox(height: 8),
                        const Text(
                          "Speak clearly: describe the injury, symptoms, or emergency context",
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _startRecording,
                          icon: const Icon(Icons.mic, size: 18),
                          label: const Text("RECORD VOICE NOTE"),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0052FF),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                      ] else if (_isRecording) ...[
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.fiber_manual_record, color: AppTheme.primary, size: 16),
                            SizedBox(width: 6),
                            Text("RECORDING VOICE BRIEF...", style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w900, fontSize: 12)),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          "00:${_recordingSeconds.toString().padLeft(2, '0')}",
                          style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, fontFamily: "monospace", color: AppTheme.darkNavy),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _stopRecording,
                          icon: const Icon(Icons.stop, size: 18),
                          label: const Text("STOP RECORDING"),
                          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                        ),
                      ] else ...[
                        // Saved Voice Note Player
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: const Color(0xFFEEF3FF), borderRadius: BorderRadius.circular(14)),
                          child: Row(
                            children: [
                              IconButton(
                                icon: Icon(_isPlaying ? Icons.pause_circle_filled : Icons.play_circle_fill, color: AppTheme.primary, size: 36),
                                onPressed: _togglePlayback,
                              ),
                              const SizedBox(width: 8),
                                const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text("Emergency Voice Brief Saved", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: AppTheme.primary), maxLines: 1, overflow: TextOverflow.ellipsis),
                                    Text("Original audio attached to case dispatch", style: TextStyle(fontSize: 10, color: Color(0xFF64748B)), maxLines: 1, overflow: TextOverflow.ellipsis),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, color: Color(0xFF64748B)),
                                onPressed: _deleteRecording,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextButton.icon(
                          onPressed: _startRecording,
                          icon: const Icon(Icons.refresh, size: 14),
                          label: const Text("Re-record Voice Brief", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // 4. EMERGENCY DESCRIPTION (PRD Section 9)
                const Text(
                  "EMERGENCY DESCRIPTION (OPTIONAL)",
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 1),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _descController,
                  maxLines: 2,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: "e.g. Road accident, severe bleeding from left leg...",
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                  ),
                ),

                const SizedBox(height: 24),

                // 5. AMBULANCE DISPATCH REQUIREMENT
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "AMBULANCE DISPATCH REQUIREMENT",
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 1),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: _ambulanceRequired ? const Color(0xFFEFF6FF) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: _ambulanceRequired ? const Color(0xFFBFDBFE) : const Color(0xFFCBD5E1),
                        ),
                      ),
                      child: Text(
                        _ambulanceRequired ? "ALS PRIORITY" : "SELF TRANSPORT",
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          color: _ambulanceRequired ? AppTheme.primary : const Color(0xFF475569),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Card 1: Ambulance Required
                GestureDetector(
                  onTap: () => setState(() => _ambulanceRequired = true),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: _ambulanceRequired ? const Color(0xFFEFF6FF) : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: _ambulanceRequired ? AppTheme.primary : const Color(0xFFE2E8F0),
                        width: _ambulanceRequired ? 2 : 1,
                      ),
                      boxShadow: _ambulanceRequired
                          ? [
                              BoxShadow(
                                color: AppTheme.primary.withOpacity(0.08),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              )
                            ]
                          : [],
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: _ambulanceRequired ? AppTheme.primary : const Color(0xFFF1F5F9),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.emergency,
                            color: _ambulanceRequired ? Colors.white : const Color(0xFF64748B),
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      I18nService.t('emergency.ambulanceRequired'),
                                      style: TextStyle(
                                        fontWeight: FontWeight.w900,
                                        fontSize: 13,
                                        color: _ambulanceRequired ? AppTheme.primary : const Color(0xFF0F172A),
                                      ),
                                    ),
                                  ),
                                  Icon(
                                    _ambulanceRequired ? Icons.radio_button_checked : Icons.radio_button_off,
                                    color: _ambulanceRequired ? AppTheme.primary : const Color(0xFFCBD5E1),
                                    size: 18,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                I18nService.t('emergency.ambulanceRequiredSub'),
                                style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), height: 1.3),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 10),

                // Card 2: Self-Transport / Not Required
                GestureDetector(
                  onTap: () => setState(() => _ambulanceRequired = false),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: !_ambulanceRequired ? const Color(0xFFF0FDF4) : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: !_ambulanceRequired ? const Color(0xFF059669) : const Color(0xFFE2E8F0),
                        width: !_ambulanceRequired ? 2 : 1,
                      ),
                      boxShadow: !_ambulanceRequired
                          ? [
                              BoxShadow(
                                color: const Color(0xFF059669).withOpacity(0.08),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              )
                            ]
                          : [],
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: !_ambulanceRequired ? const Color(0xFF059669) : const Color(0xFFF1F5F9),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.directions_car,
                            color: !_ambulanceRequired ? Colors.white : const Color(0xFF64748B),
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      I18nService.t('emergency.selfTransport'),
                                      style: TextStyle(
                                        fontWeight: FontWeight.w900,
                                        fontSize: 13,
                                        color: !_ambulanceRequired ? const Color(0xFF065F46) : const Color(0xFF0F172A),
                                      ),
                                    ),
                                  ),
                                  Icon(
                                    !_ambulanceRequired ? Icons.radio_button_checked : Icons.radio_button_off,
                                    color: !_ambulanceRequired ? const Color(0xFF059669) : const Color(0xFFCBD5E1),
                                    size: 18,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                I18nService.t('emergency.selfTransportSub'),
                                style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), height: 1.3),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // Submit to Decision Engine
                ElevatedButton(
                  onPressed: _proceedToDecisionEngine,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.auto_awesome, size: 20),
                      SizedBox(width: 8),
                      Flexible(
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text("FIND BEST HOSPITAL →", style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
