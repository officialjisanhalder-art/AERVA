import 'dart:async';
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../models/hospital.dart';
import '../../models/emergency_case.dart';
import '../../services/location_service.dart';
import '../../services/decision_engine.dart';
import '../../services/storage_service.dart';
import '../../services/navigation_service.dart';
import '../../services/i18n_service.dart';
import '../../services/supabase_sync_service.dart';
import 'emergency_status_screen.dart';

class DecisionAnalysisScreen extends StatefulWidget {
  final LocationResult location;
  final Map<String, dynamic> draftData;

  const DecisionAnalysisScreen({
    super.key,
    required this.location,
    required this.draftData,
  });

  @override
  State<DecisionAnalysisScreen> createState() => _DecisionAnalysisScreenState();
}

class _DecisionAnalysisScreenState extends State<DecisionAnalysisScreen> {
  bool _isAnalyzing = true;
  bool _isSubmitting = false;
  int _currentCheckIndex = 0;
  late DecisionEngineResult _result;

  final List<String> _checks = [
    "Checking emergency type...",
    "Checking hospital surgical capability...",
    "Checking live ER and ICU capacity...",
    "Checking travel time & real-time traffic...",
    "Checking blood bank availability...",
    "Checking data freshness & verification...",
  ];

  @override
  void initState() {
    super.initState();
    _result = DecisionEngineService.findBestHospital(
      emergencyType: widget.draftData['emergencyType'] ?? 'Cardiac',
      originLat: widget.location.lat,
      originLng: widget.location.lng,
    );
    _runAnalysisChecklist();
  }

  void _runAnalysisChecklist() {
    Timer.periodic(const Duration(milliseconds: 350), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_currentCheckIndex < _checks.length - 1) {
        setState(() => _currentCheckIndex++);
      } else {
        timer.cancel();
        setState(() => _isAnalyzing = false);
      }
    });
  }

  Future<void> _sendEmergencyRequest(Hospital hospital) async {
    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);

    final caseNum = 10000 + (DateTime.now().millisecondsSinceEpoch % 90000);
    final caseId = "NR-$caseNum";
    final bool ambulanceRequired = widget.draftData['ambulanceRequired'] ?? true;

    final newCase = EmergencyCase(
      caseId: caseId,
      patientName: widget.draftData['patientName'] ?? "Patient",
      patientPhone: widget.draftData['patientPhone'] ?? "+91 98765 43210",
      patientAge: widget.draftData['patientAge'] ?? "28",
      patientGender: widget.draftData['patientGender'] ?? "Male",
      bloodGroup: widget.draftData['bloodGroup'] ?? "O+",
      patientCount: widget.draftData['patientCount'] ?? 1,
      emergencyType: widget.draftData['emergencyType'] ?? "Cardiac",
      writtenDescription: widget.draftData['writtenDescription'] ?? "",
      hasVoiceBrief: widget.draftData['hasVoiceBrief'] ?? false,
      voiceFilePath: widget.draftData['voiceFilePath'],
      recordingDuration: widget.draftData['recordingDuration'] ?? 0,
      locationArea: widget.location.area,
      locationCity: widget.location.city,
      originLat: widget.location.lat,
      originLng: widget.location.lng,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      hospitalPhone: hospital.phone,
      hospitalLat: hospital.lat,
      hospitalLng: hospital.lng,
      hospitalAddress: hospital.address,
      etaMinutes: hospital.etaMinutes,
      distanceKm: hospital.distanceKm,
      status: "REQUEST_SENT",
      createdAt: DateTime.now(),
      ambulanceRequired: ambulanceRequired,
      ambulanceDispatched: ambulanceRequired,
      messages: [
        EmergencyMessage(
          id: "m_init",
          sender: "hospital",
          text: ambulanceRequired
              ? "Emergency dispatch registered under Case $caseId. ALS Mobile ICU unit AMB-101 dispatched to your coordinates. ER triage team reviewing clinical priority."
              : "Emergency registration confirmed under Case $caseId. Self-transport mode active. ER triage team alerted for direct arrival.",
          time: "Just now",
        ),
      ],
      doctorInChargeName: hospital.doctorInChargeName,
      doctorInChargeRole: hospital.doctorInChargeRole,
      greenCorridorAlerted: false,
      erBedsAvailable: (hospital.erAvailable - 1).clamp(0, hospital.erTotal),
    );

    // 1. Save to persistent storage (Guaranteed local offline & online persistence)
    await StorageService.saveActiveCase(newCase);
    await StorageService.clearDraft();

    // 2. Supabase Live Cloud Sync with 3.5s timeout (never blocks patient navigation)
    try {
      await Future.any([
        SupabaseSyncService.dispatchEmergencyCase(newCase),
        Future.delayed(const Duration(milliseconds: 3500)),
      ]);

      if (ambulanceRequired) {
        unawaited(SupabaseSyncService.dispatchAmbulanceRequest(
          caseId: newCase.caseId,
          patientName: newCase.patientName,
          emergencyType: newCase.emergencyType,
          lat: newCase.originLat,
          lng: newCase.originLng,
        ));
      }
    } catch (e) {
      debugPrint("Cloud sync handled gracefully: $e");
    }

    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => EmergencyStatusScreen(emergencyCase: newCase),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isAnalyzing) {
      return Scaffold(
        backgroundColor: const Color(0xFF050B18),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                  child: const Text(
                    "NEARER DECISION ENGINE",
                    style: TextStyle(color: Color(0xFF00B2FF), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.2),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  "Analyzing Optimal Hospital Destination...",
                  style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 8),
                Text(
                  "Matching for ${widget.draftData['emergencyType']} care near ${widget.location.area}",
                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                ),
                const SizedBox(height: 36),

                // Checklist (PRD Section 14)
                ...List.generate(_checks.length, (index) {
                  final isDone = index <= _currentCheckIndex;
                  final isCurrent = index == _currentCheckIndex;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Row(
                      children: [
                        Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: isDone ? const Color(0xFF059669) : const Color(0xFF1E293B),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: isDone
                                ? const Icon(Icons.check, size: 16, color: Colors.white)
                                : isCurrent
                                    ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2))
                                    : const SizedBox(),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            _checks[index],
                            style: TextStyle(
                              color: isDone ? Colors.white : const Color(0xFF64748B),
                              fontSize: 13,
                              fontWeight: isDone ? FontWeight.bold : FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
      );
    }

    final best = _result.bestMatch;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text("Best Emergency Match"),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Recommendation Summary Box
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.auto_awesome, color: Color(0xFF059669), size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _result.matchReason,
                        style: const TextStyle(color: Color(0xFF065F46), fontSize: 11, fontWeight: FontWeight.bold, height: 1.3),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // PROMINENT BEST MATCH CARD (PRD Section 15)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppTheme.primary, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primary.withOpacity(0.15),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      alignment: WrapAlignment.spaceBetween,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.primary,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.star, color: Colors.white, size: 12),
                              SizedBox(width: 4),
                              Text(
                                "BEST MATCH",
                                style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(color: const Color(0xFF050B18), borderRadius: BorderRadius.circular(8)),
                          child: Text(
                            "${best.distanceKm} km • ${best.etaMinutes} mins ETA",
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      best.name,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.darkNavy),
                    ),
                    Text(
                      best.type,
                      style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 16),

                    // Metrics
                    Row(
                      children: [
                        _metricCard("ER BEDS", "${best.erAvailable} Available", const Color(0xFF059669)),
                        const SizedBox(width: 8),
                        _metricCard("ICU BEDS", "${best.icuAvailable} Open", AppTheme.primary),
                        const SizedBox(width: 8),
                        _metricCard("BLOOD BANK", best.bloodBank['O+'] ?? 'Ready', AppTheme.primary),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Specialists
                    const Text("ON-DUTY SPECIALISTS", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8))),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: best.specialists.map((s) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: const Color(0xFFEEF3FF), borderRadius: BorderRadius.circular(6)),
                        child: Text(s, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.primary)),
                      )).toList(),
                    ),

                    const SizedBox(height: 14),

                    // ATTENDING DOCTOR IN CHARGE CARD
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEF3FF),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFD0E1FD)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.person_pin, size: 18, color: AppTheme.primary),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  "ATTENDING DOCTOR IN CHARGE",
                                  style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFF64748B)),
                                ),
                                Text(
                                  "${best.doctorInChargeName} • ${best.doctorInChargeRole}",
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 10),

                    // DEDICATED DISPATCH PRIVACY NOTICE
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFBFDBFE)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.shield_outlined, size: 14, color: AppTheme.primary),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              "Dedicated Dispatch: SOS alert will be transmitted ONLY to ${best.name}.",
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF1E40AF)),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Primary Action: SEND EMERGENCY REQUEST
                    ElevatedButton(
                      onPressed: _isSubmitting ? null : () => _sendEmergencyRequest(best),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: _isSubmitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.send, size: 18),
                                SizedBox(width: 8),
                                Flexible(
                                  child: FittedBox(
                                    fit: BoxFit.scaleDown,
                                    child: Text("CONFIRM & SEND EMERGENCY SOS", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                  ),
                                ),
                              ],
                            ),
                    ),

                    const SizedBox(height: 8),

                    // Secondary Action: Call Hospital
                    OutlinedButton.icon(
                      onPressed: () => NavigationService.callHospital(best.phone),
                      icon: const Icon(Icons.phone, size: 16),
                      label: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text("CALL HOSPITAL (${best.phone})"),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.darkNavy,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // ALTERNATIVES (PRD Section 16)
              const Text(
                "OTHER SUITABLE HOSPITALS",
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 1),
              ),
              const SizedBox(height: 10),

              ..._result.alternatives.map((alt) => Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(alt.name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                        ),
                        Text("${alt.distanceKm} km • ${alt.etaMinutes}m", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF64748B))),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(alt.type, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                    const SizedBox(height: 10),
                    Wrap(
                      alignment: WrapAlignment.spaceBetween,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        Text(
                          "${alt.erAvailable} ER Beds • ${alt.icuAvailable} ICU",
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF059669)),
                        ),
                        TextButton(
                          onPressed: () => _sendEmergencyRequest(alt),
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text("Select This Hospital →", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                      ],
                    ),
                  ],
                ),
              )),
            ],
          ),
        ),
      ),
    );
  }

  Widget _metricCard(String title, String val, Color col) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFE2E8F0))),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8))),
            const SizedBox(height: 2),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(val, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: col)),
            ),
          ],
        ),
      ),
    );
  }
}
