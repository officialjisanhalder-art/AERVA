import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:geolocator/geolocator.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../theme/app_theme.dart';
import '../models/emergency_case.dart';
import '../models/patient_profile.dart';
import '../services/storage_service.dart';
import '../services/i18n_service.dart';
import '../services/supabase_sync_service.dart';
import 'auth_screen.dart';
import 'patient_dashboard_screen.dart';
import 'emergency/location_capture_screen.dart';
import 'emergency/emergency_status_screen.dart';
import 'emergency/ambulance_tracking_screen.dart';
import '../services/navigation_service.dart';

class SplashWelcomeScreen extends StatefulWidget {
  const SplashWelcomeScreen({super.key});

  @override
  State<SplashWelcomeScreen> createState() => _SplashWelcomeScreenState();
}

class _SplashWelcomeScreenState extends State<SplashWelcomeScreen> {
  bool _isLoading = true;
  bool _isLoggedIn = false;
  Map<String, dynamic>? _user;
  PatientProfile? _profile;
  EmergencyCase? _activeCase;

  @override
  void initState() {
    super.initState();
    _loadState();
  }

  Future<void> _callNumber(String phone) async {
    try {
      final clean = phone.replaceAll(RegExp(r'[^0-9+]'), '');
      final uri = Uri.parse('tel:$clean');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    } catch (e) {
      debugPrint("Error calling $phone: $e");
    }
  }

  Future<void> _triggerInstantSOS() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: AppTheme.primary, size: 28),
            SizedBox(width: 10),
            Text("Confirm Instant SOS", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
          ],
        ),
        content: const Text(
          "This will immediately transmit your phone number, live GPS coordinates, and urgent Critical alert to nearby hospital emergency departments.",
          style: TextStyle(fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text("CANCEL", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text("TRIGGER SOS NOW", style: TextStyle(fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("🚨 Transmitting Critical SOS to nearest hospital desks..."),
        backgroundColor: Color(0xFF0A2540),
        duration: Duration(seconds: 2),
      ),
    );

    double lat = 22.5645;
    double lng = 88.4069;
    String area = "Salt Lake";
    String city = "Kolkata";

    try {
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 3),
      );
      lat = pos.latitude;
      lng = pos.longitude;
    } catch (_) {}

    final profile = _profile ?? PatientProfile.defaultProfile();
    final caseId = "NR-SOS-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}";

    final sosCase = EmergencyCase(
      caseId: caseId,
      patientName: profile.fullName.isNotEmpty ? profile.fullName : "Jisan Halder",
      patientPhone: profile.phone.isNotEmpty ? profile.phone : "+91 98765 43210",
      patientAge: profile.age.isNotEmpty ? profile.age : "28",
      patientGender: profile.gender.isNotEmpty ? profile.gender : "Male",
      bloodGroup: profile.bloodGroup.isNotEmpty ? profile.bloodGroup : "O+",
      patientCount: 1,
      emergencyType: "Critical SOS / Immediate Resuscitation",
      writtenDescription: "1-Tap Patient SOS Triggered: Severe Emergency. Live Location: $area, $city. Mobile: ${profile.phone}. Kin: ${profile.emergencyContactName} (${profile.emergencyContactPhone}). Allergies: ${profile.allergies.map((a) => a.name).join(', ')}",
      hasVoiceBrief: false,
      recordingDuration: 0,
      status: "REQUEST_SENT",
      hospitalId: "h2_amri",
      hospitalName: "AMRI Hospital Salt Lake",
      hospitalAddress: "JC 16 & 17, Sector III, Salt Lake, Kolkata",
      originLat: lat,
      originLng: lng,
      locationArea: area,
      locationCity: city,
      hospitalLat: 22.5697,
      hospitalLng: 88.4124,
      etaMinutes: 6,
      distanceKm: 2.1,
      hospitalPhone: "+91 33 6606 3800",
      doctorInChargeName: "Dr. Debashis Roy (Chief ER)",
      assignedBedBay: "Red Bay 01 (Resuscitation)",
      erBedsAvailable: 4,
      greenCorridorAlerted: true,
      createdAt: DateTime.now(),
      messages: [
        EmergencyMessage(
          id: "m_sos_1",
          sender: "system",
          text: "🚨 1-Tap Emergency SOS Dispatched to AMRI Hospital ER Team & Traffic Police.",
          time: "${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}",
        )
      ],
    );

    await StorageService.saveActiveCase(sosCase);
    await SupabaseSyncService.dispatchEmergencyCase(sosCase);

    if (mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => EmergencyStatusScreen(emergencyCase: sosCase),
        ),
      );
    }
  }

  Future<void> _loadState() async {
    final loggedIn = await StorageService.isLoggedIn();
    final user = await StorageService.getCurrentUser();
    final profile = await StorageService.getProfile();
    final activeCase = await StorageService.getActiveCase();

    if (mounted) {
      setState(() {
        _isLoggedIn = loggedIn;
        _user = user;
        _profile = profile;
        _activeCase = activeCase;
        _isLoading = false;
      });
    }
  }

  Future<void> _dismissActiveCase() async {
    await StorageService.clearActiveCase();
    await _loadState();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("✓ Emergency case archived to your Medical History"),
          backgroundColor: Color(0xFF059669),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  void _showAdmissionPassModal(EmergencyCase c) {
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
                decoration: BoxDecoration(color: const Color(0xFF059669), borderRadius: BorderRadius.circular(8)),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.check_circle_rounded, color: Colors.white, size: 14),
                    SizedBox(width: 4),
                    Text(
                      "ADMISSION CONFIRMED",
                      style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.8),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              Text(
                c.patientName,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.darkNavy),
              ),
              Text(
                "Case ID: ${c.caseId} • Blood: ${c.bloodGroup}",
                style: const TextStyle(fontSize: 11, fontFamily: "monospace", color: Color(0xFF64748B), fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: QrImageView(
                  data: "https://nearer.app/pass/${c.caseId}",
                  version: QrVersions.auto,
                  size: 180.0,
                ),
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Admitted to: ${c.hospitalName}", style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF065F46))),
                    const SizedBox(height: 2),
                    Text("Locked Bay: ${c.assignedBedBay.isNotEmpty ? c.assignedBedBay : 'Red Bay 01 (Critical Care)'}", style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF059669))),
                    const SizedBox(height: 2),
                    Text("Attending: ${c.doctorInChargeName}", style: const TextStyle(fontSize: 10, color: Color(0xFF047857))),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Close"),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const PatientDashboardScreen(initialTab: 4)),
              );
            },
            child: const Text("View All Care History →", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.white,
      );
    }

    return ValueListenableBuilder<String>(
      valueListenable: I18nService.currentLang,
      builder: (context, lang, _) {
        return Scaffold(
          backgroundColor: Colors.white,
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 8),
                  // Top Bar with Language Switcher and Login / Profile button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Image.asset(
                            'assets/images/nearer_mark.png',
                            height: 30,
                            fit: BoxFit.contain,
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            "NearER",
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: AppTheme.darkNavy,
                              letterSpacing: -0.5,
                            ),
                          ),
                        ],
                      ),
                      Flexible(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Language Switcher
                            InkWell(
                              onTap: () => I18nService.toggleLanguage(),
                              borderRadius: BorderRadius.circular(16),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: const Color(0xFFCBD5E1)),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      lang == 'en' ? "🇮🇳 " : "🇬🇧 ",
                                      style: const TextStyle(fontSize: 11),
                                    ),
                                    Text(
                                      lang == 'en' ? "हिंदी" : "EN",
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.darkNavy,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                            if (_isLoggedIn)
                              Flexible(
                                child: InkWell(
                                  onTap: () async {
                                    await Navigator.push(
                                      context,
                                      MaterialPageRoute(builder: (_) => const PatientDashboardScreen()),
                                    );
                                    _loadState();
                                  },
                                  borderRadius: BorderRadius.circular(20),
                                  child: Container(
                                    constraints: const BoxConstraints(maxWidth: 110),
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEEF3FF),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(color: AppTheme.primary.withOpacity(0.2)),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.person, size: 14, color: AppTheme.primary),
                                        const SizedBox(width: 4),
                                        Flexible(
                                          child: Text(
                                            _user?["name"] ?? "Passport",
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              color: AppTheme.primary,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              )
                            else
                              TextButton(
                                onPressed: () async {
                                  await Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => const AuthScreen()),
                                  );
                                  _loadState();
                                },
                                style: TextButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  minimumSize: Size.zero,
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                child: Text(
                                  lang == 'hi' ? "लॉग इन" : "Log In",
                                  style: const TextStyle(
                                    color: AppTheme.primary,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),

              const SizedBox(height: 24),

              // Emergency Banner: Active Transit OR Admission Confirmed Handover Pass
              if (_activeCase != null) ...[
                if (_activeCase!.status == "ARRIVED" ||
                    _activeCase!.status == "ADMITTED" ||
                    _activeCase!.status == "COMPLETED")
                  // ADMISSION CONFIRMED PASS / ID CARD
                  Container(
                    margin: const EdgeInsets.only(bottom: 24),
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF064E3B), Color(0xFF047857)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: const Color(0xFF34D399), width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF059669).withOpacity(0.25),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.check_circle_rounded, color: Color(0xFF059669), size: 14),
                                  SizedBox(width: 4),
                                  Text(
                                    "ADMISSION CONFIRMED",
                                    style: TextStyle(
                                      color: Color(0xFF065F46),
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 0.8,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              "Case: ${_activeCase!.caseId}",
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 11,
                                fontFamily: "monospace",
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          _activeCase!.patientName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          "${_activeCase!.emergencyType} Emergency • Blood: ${_activeCase!.bloodGroup}",
                          style: const TextStyle(color: Color(0xFFA7F3D0), fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 10),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "Admitted to: ${_activeCase!.hospitalName}",
                                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                "Locked Triage Bay: ${_activeCase!.assignedBedBay.isNotEmpty ? _activeCase!.assignedBedBay : 'Red Bay 01 (Critical Resuscitation)'}",
                                style: const TextStyle(color: Color(0xFF6EE7B7), fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                "Attending Lead: ${_activeCase!.doctorInChargeName}",
                                style: const TextStyle(color: Colors.white70, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            Expanded(
                              flex: 3,
                              child: ElevatedButton.icon(
                                onPressed: () => _showAdmissionPassModal(_activeCase!),
                                icon: const Icon(Icons.qr_code_2, size: 18),
                                label: const FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Text("VIEW ADMISSION PASS", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  foregroundColor: const Color(0xFF065F46),
                                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              flex: 2,
                              child: OutlinedButton(
                                onPressed: _dismissActiveCase,
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: Colors.white54),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                child: const FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Text("DISMISS", style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  )
                else
                  // Active Emergency Banner (In Transit)
                  Container(
                    margin: const EdgeInsets.only(bottom: 24),
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF0052FF).withOpacity(0.4), width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF0052FF).withOpacity(0.2),
                          blurRadius: 15,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.25),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.warning_amber_rounded, color: Colors.white, size: 14),
                                  SizedBox(width: 4),
                                  Text(
                                    "ACTIVE EMERGENCY",
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 1,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Spacer(),
                            Flexible(
                              child: Text(
                                "Case: ${_activeCase!.caseId}",
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                  fontFamily: "monospace",
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          "${_activeCase!.emergencyType} Emergency • ${_activeCase!.hospitalName}",
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Status: ${_activeCase!.status.replaceAll('_', ' ')}",
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            Expanded(
                              flex: 3,
                              child: ElevatedButton(
                                onPressed: () async {
                                  await Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => EmergencyStatusScreen(emergencyCase: _activeCase!),
                                    ),
                                  );
                                  _loadState();
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  foregroundColor: AppTheme.primary,
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Text(
                                    lang == 'hi' ? "सक्रिय मामला देखें →" : "VIEW STATUS →",
                                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              flex: 2,
                              child: _activeCase!.ambulanceRequired
                                  ? ElevatedButton.icon(
                                      onPressed: () async {
                                        await Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) => AmbulanceTrackingScreen(emergencyCase: _activeCase!),
                                          ),
                                        );
                                        _loadState();
                                      },
                                      icon: const Icon(Icons.radar, size: 16),
                                      label: const FittedBox(
                                        fit: BoxFit.scaleDown,
                                        child: Text(
                                          "AMBULANCE",
                                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11),
                                        ),
                                      ),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFF0F172A),
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(12),
                                          side: const BorderSide(color: Colors.white38),
                                        ),
                                      ),
                                    )
                                  : ElevatedButton.icon(
                                      onPressed: () {
                                        NavigationService.launchGoogleMaps(
                                          destLat: _activeCase!.hospitalLat,
                                          destLng: _activeCase!.hospitalLng,
                                          hospitalName: _activeCase!.hospitalName,
                                        );
                                      },
                                      icon: const Icon(Icons.navigation, size: 16),
                                      label: const FittedBox(
                                        fit: BoxFit.scaleDown,
                                        child: Text(
                                          "ROUTE",
                                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11),
                                        ),
                                      ),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFF059669),
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                      ),
                                    ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
              ],

              // Patient SOS Hub Card
              Container(
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFEFF6FF), Color(0xFFF0F9FF)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFBFDBFE), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0052FF).withOpacity(0.08),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.primary,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.emergency_rounded, color: Colors.white, size: 14),
                                const SizedBox(width: 4),
                                Flexible(
                                  child: FittedBox(
                                    fit: BoxFit.scaleDown,
                                    child: Text(
                                      lang == 'hi' ? "रोगी आपातकालीन एसओएस" : "PATIENT SOS HUB",
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.8,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDBEAFE),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            "LIVE DISPATCH",
                            style: TextStyle(
                              color: AppTheme.primary,
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Patient Details Box
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFDBEAFE)),
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDBEAFE),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.person_rounded, color: AppTheme.primary, size: 20),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _profile?.fullName.isNotEmpty == true ? _profile!.fullName : "Jisan Halder",
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w900,
                                        color: AppTheme.darkNavy,
                                      ),
                                    ),
                                    Text(
                                      "📞 ${_profile?.phone.isNotEmpty == true ? _profile!.phone : (_user?['mobile'] ?? '+91 98765 43210')}",
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.primary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  "Blood: ${_profile?.bloodGroup.isNotEmpty == true ? _profile!.bloodGroup : 'O+'}",
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: AppTheme.darkNavy,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const Divider(height: 16, color: Color(0xFFF1F5F9)),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      lang == 'hi' ? "आपातकालीन संपर्क (परिवार):" : "Emergency Contact (Kin):",
                                      style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w600),
                                    ),
                                    Text(
                                      "${_profile?.emergencyContactName.isNotEmpty == true ? _profile!.emergencyContactName : 'Subhash Halder'} (${_profile?.emergencyContactPhone.isNotEmpty == true ? _profile!.emergencyContactPhone : '+91 98301 23456'})",
                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.darkNavy),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                              IconButton(
                                constraints: const BoxConstraints(),
                                padding: const EdgeInsets.all(6),
                                icon: const Icon(Icons.phone_in_talk_rounded, color: Color(0xFF16A34A), size: 20),
                                onPressed: () => _callNumber(
                                  _profile?.emergencyContactPhone.isNotEmpty == true
                                      ? _profile!.emergencyContactPhone
                                      : '+91 98301 23456',
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Quick Dial Helplines
                    Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: () => _callNumber('112'),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFFCBD5E1)),
                              ),
                              child: const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.phone_forwarded, color: Color(0xFF2563EB), size: 15),
                                  SizedBox(width: 4),
                                  Flexible(
                                    child: FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        "Dial 112 (Police)",
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w800,
                                          color: Color(0xFF0F172A),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: InkWell(
                            onTap: () => _callNumber('108'),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFFCBD5E1)),
                              ),
                              child: const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.local_hospital_rounded, color: AppTheme.primary, size: 15),
                                  SizedBox(width: 4),
                                  Flexible(
                                    child: FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        "Dial 108 (Ambulance)",
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w800,
                                          color: Color(0xFF0F172A),
                                        ),
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
                    const SizedBox(height: 10),

                    // NearER ALS Ambulance Live Radar Quick Action
                    InkWell(
                      onTap: () {
                        final c = _activeCase ??
                            EmergencyCase(
                              caseId: "NR-10482",
                              patientName: _profile?.fullName.isNotEmpty == true ? _profile!.fullName : "Jisan Halder",
                              patientPhone: _profile?.phone.isNotEmpty == true ? _profile!.phone : "+91 98765 43210",
                              patientAge: "28",
                              patientGender: "Male",
                              bloodGroup: _profile?.bloodGroup.isNotEmpty == true ? _profile!.bloodGroup : "O+",
                              patientCount: 1,
                              emergencyType: "Cardiac",
                              writtenDescription: "Chest pain and shortness of breath",
                              hasVoiceBrief: false,
                              recordingDuration: 0,
                              locationArea: "Salt Lake",
                              locationCity: "Kolkata",
                              originLat: 22.5726,
                              originLng: 88.3639,
                              hospitalId: "h1_apollo",
                              hospitalName: "Apollo Multispeciality Hospital",
                              hospitalPhone: "+91 33 2320 3040",
                              hospitalLat: 22.5697,
                              hospitalLng: 88.4022,
                              hospitalAddress: "58 Canal Circular Road, Kadapara, Phool Bagan, Kolkata 700054",
                              etaMinutes: 6,
                              distanceKm: 2.4,
                              status: "EN_ROUTE",
                              createdAt: DateTime.now(),
                              messages: [],
                              doctorInChargeName: "Dr. A. Sengupta",
                              doctorInChargeRole: "Chief Interventional Cardiologist",
                              assignedBedBay: "Red Bay 01",
                              greenCorridorAlerted: true,
                              erBedsAvailable: 4,
                            );
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => AmbulanceTrackingScreen(emergencyCase: c),
                          ),
                        );
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F172A),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF1E293B)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0052FF).withOpacity(0.2),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.emergency, color: Color(0xFF60A5FA), size: 16),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                lang == 'hi'
                                    ? "NearER ALS एम्बुलेंस ट्रैक करें (लाइव रडार)"
                                    : "Track NearER ALS Ambulance (Live Radar GPS)",
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const Icon(Icons.arrow_forward_ios, color: Colors.white38, size: 12),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // 1-Tap SOS Dispatch Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _triggerInstantSOS,
                        icon: const Icon(Icons.notification_important_rounded, color: Colors.white, size: 18),
                        label: FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(
                            lang == 'hi' ? "🚨 तत्काल अस्पताल एसओएस भेजें" : "🚨 TRIGGER 1-TAP HOSPITAL SOS",
                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.5),
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                          elevation: 4,
                          shadowColor: AppTheme.primary.withOpacity(0.4),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Hero Presentation
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0052FF), Color(0xFF0047E0), Color(0xFF0A2540)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primary.withOpacity(0.25),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        lang == 'hi' ? "निर्णय इंजन मंच (DECISION ENGINE)" : "DECISION ENGINE PLATFORM",
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      lang == 'hi'
                          ? "केवल निकटतम अस्पताल मत खोजें।\nसही अस्पताल चुनें।"
                          : "Don’t just find the nearest hospital.\nFind the right one.",
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        height: 1.25,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      lang == 'hi'
                          ? "NearER लाइव ईआर क्षमता, सर्जिकल उपलब्धता, ट्रॉमा तत्परता और यात्रा समय का मूल्यांकन करके अस्पताल सुझाता है।"
                          : "NearER intelligently evaluates live ER capacity, surgical capability, stroke/trauma readiness, and travel time before routing.",
                      style: const TextStyle(
                        color: Color(0xFFD0E1FD),
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Feature tags
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _tag(Icons.flash_on, lang == 'hi' ? "लाइव जीपीएस" : "Live GPS First"),
                        _tag(Icons.mic, lang == 'hi' ? "वॉइस ब्रीफ" : "Voice Brief"),
                        _tag(Icons.medical_services, lang == 'hi' ? "आईसीयू / ईआर बेड" : "ICU / ER Beds"),
                        _tag(Icons.navigation, lang == 'hi' ? "गूगल मैप्स नेविगेशन" : "Google Maps Direct"),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 28),

              // PRIMARY ACTION: GET EMERGENCY HELP (PRD Section 2)
              ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const LocationCaptureScreen()),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  elevation: 6,
                  shadowColor: AppTheme.primary.withOpacity(0.4),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.emergency, size: 24),
                    const SizedBox(width: 10),
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          I18nService.t('welcome.getHelp'),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 14),

              // SUB-TEXT: WORKS WITHOUT LOGIN
              Center(
                child: Text(
                  lang == 'hi'
                      ? "⚡ बिना लॉगिन के काम करता है • 1-टैप जीपीएस लोकेशन ट्रैकिंग"
                      : "⚡ Zero login barrier • 1-tap instant GPS location capture",
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),

              const SizedBox(height: 28),

              // Patient Account Cards
              Text(
                I18nService.t('welcome.patientPassport').toUpperCase(),
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF94A3B8),
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 12),

              InkWell(
                onTap: () async {
                  if (_isLoggedIn) {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const PatientDashboardScreen()),
                    );
                  } else {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const AuthScreen()),
                    );
                  }
                  _loadState();
                },
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEEF3FF),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.shield_outlined, color: AppTheme.primary, size: 26),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _isLoggedIn ? I18nService.t('welcome.patientPassport') : (lang == 'hi' ? "रोगी लॉगिन एवं पासपोर्ट वॉल्ट" : "Patient Login & Passport Vault"),
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.darkNavy,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              _isLoggedIn
                                  ? (lang == 'hi' ? "एलर्जी, चालू दवाएं और नुस्खे प्रबंधित करें" : "Manage allergies, ongoing medications & prescriptions")
                                  : (lang == 'hi' ? "आपातकाल में त्वरित ऑटो-भरने के लिए साइन इन करें" : "Sign in to save medical history for 1-tap auto-prefill"),
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF94A3B8)),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  },
);
}

  Widget _tag(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.white),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
