import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../models/emergency_case.dart';
import '../../services/navigation_service.dart';
import '../../services/supabase_sync_service.dart';
import '../../services/i18n_service.dart';
import '../../theme/app_theme.dart';

class AmbulanceTrackingScreen extends StatefulWidget {
  final EmergencyCase emergencyCase;

  const AmbulanceTrackingScreen({
    super.key,
    required this.emergencyCase,
  });

  @override
  State<AmbulanceTrackingScreen> createState() => _AmbulanceTrackingScreenState();
}

class _AmbulanceTrackingScreenState extends State<AmbulanceTrackingScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  Timer? _telemetryTimer;

  // Ambulance Telemetry & Metadata
  final String _vehicleId = "AMB-101";
  final String _vehicleType = "ALS Mobile ICU";
  final String _regNumber = "WB 02 AJ 4092";
  String _status = "DISPATCHED_TO_PATIENT";
  int _etaMinutes = 6;
  double _distanceKm = 2.4;
  int _speedKmH = 48;
  final int _oxygenPct = 98;
  bool _greenCorridor = true;

  // Crew Credentials
  final String _driverName = "Rajesh Mondal";
  final String _driverPhone = "+91 98311 88221";
  final String _paramedicName = "Sunita Roy";
  final String _paramedicRole = "Lead ALS Paramedic (Reg #WB-PARA-4491)";
  final String _paramedicPhone = "+91 98311 88222";

  // Verified Life-Support Equipment Onboard
  final List<Map<String, dynamic>> _equipmentList = [
    {
      "name": "Hamilton-T1 Transport Mechanical Ventilator",
      "status": "ONLINE",
      "icon": Icons.air,
    },
    {
      "name": "Zoll X-Series Biphasic Defibrillator & Pacer",
      "status": "VERIFIED",
      "icon": Icons.monitor_heart,
    },
    {
      "name": "Philips IntelliVue Multipara Monitor (ECG/SpO2/EtCO2)",
      "status": "CALIBRATED",
      "icon": Icons.show_chart,
    },
    {
      "name": "B.Braun Perfusor Space Infusion Syringe Pump",
      "status": "CHARGED",
      "icon": Icons.medication_liquid,
    },
    {
      "name": "Trauma Surgical Airway & O-Neg RBC Pack",
      "status": "STOCKED",
      "icon": Icons.bloodtype,
    },
  ];

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();

    // Subscribe to Supabase live fleet updates
    SupabaseSyncService.subscribeToAmbulance((data) {
      if (!mounted) return;
      setState(() {
        if (data['status'] != null) _status = data['status'].toString();
        if (data['eta_minutes'] != null) {
          _etaMinutes = int.tryParse(data['eta_minutes'].toString()) ?? _etaMinutes;
        }
        if (data['speed_kmh'] != null) {
          _speedKmH = int.tryParse(data['speed_kmh'].toString()) ?? _speedKmH;
        }
        if (data['green_corridor'] != null) {
          _greenCorridor = data['green_corridor'] == true;
        }
      });
    });

    // Simulated live telemetry fluctuation
    _telemetryTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (!mounted) return;
      setState(() {
        final rand = math.Random();
        _speedKmH = 44 + rand.nextInt(12);
        if (_distanceKm > 0.4 && rand.nextBool()) {
          _distanceKm = math.max(0.3, _distanceKm - 0.1);
        }
      });
    });
  }

  @override
  void dispose() {
    _animController.dispose();
    _telemetryTimer?.cancel();
    super.dispose();
  }

  void _callCrew(String phone) {
    NavigationService.callHospital(phone);
  }

  void _openNavigation() {
    NavigationService.launchGoogleMaps(
      destLat: widget.emergencyCase.hospitalLat,
      destLng: widget.emergencyCase.hospitalLng,
      originLat: widget.emergencyCase.originLat,
      originLng: widget.emergencyCase.originLng,
      hospitalName: widget.emergencyCase.hospitalName,
    );
  }

  @override
  Widget build(BuildContext context) {
    final lang = I18nService.currentLang.value;

    return Scaffold(
      backgroundColor: const Color(0xFF050B18),
      appBar: AppBar(
        backgroundColor: const Color(0xFF050B18),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              lang == 'hi' ? "लाइव एम्बुलेंस ट्रैकिंग" : "Ambulance Live Escort",
              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.white),
            ),
            Text(
              "Case: ${widget.emergencyCase.caseId} • $_vehicleId",
              style: const TextStyle(fontSize: 11, color: Color(0xFF60A5FA), fontFamily: 'monospace'),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16, top: 12, bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF059669).withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF10B981)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: Color(0xFF10B981),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  "ETA $_etaMinutes MINS",
                  style: const TextStyle(
                    color: Color(0xFF34D399),
                    fontWeight: FontWeight.w900,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ANIMATED GPS RADAR VIEW
            _buildRadarMapWidget(lang),

            const SizedBox(height: 16),

            // GREEN CORRIDOR / TRAFFIC POLICE BADGE
            if (_greenCorridor) _buildGreenCorridorCard(lang),

            const SizedBox(height: 16),

            // LIVE TELEMETRY METRICS
            _buildTelemetryRow(lang),

            const SizedBox(height: 16),

            // VEHICLE & CREW DETAILS CARD
            _buildCrewCard(lang),

            const SizedBox(height: 16),

            // ONBOARD ICU LIFE SUPPORT VERIFICATION
            _buildLifeSupportCard(lang),

            const SizedBox(height: 24),

            // ACTION BUTTONS
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _openNavigation,
                    icon: const Icon(Icons.navigation, size: 18),
                    label: const FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text("GOOGLE MAPS ROUTE", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _callCrew('108'),
                    icon: const Icon(Icons.emergency, color: AppTheme.primary, size: 18),
                    label: const FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text("DIAL 108 HELPLINE", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: AppTheme.primary)),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppTheme.primary, width: 1.5),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildRadarMapWidget(String lang) {
    return Container(
      height: 260,
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF1E293B), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0052FF).withOpacity(0.12),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Radar grid painter
          AnimatedBuilder(
            animation: _animController,
            builder: (context, child) {
              return CustomPaint(
                size: const Size(double.infinity, 260),
                painter: _RadarGridPainter(progress: _animController.value),
              );
            },
          ),

          // Header HUD readout
          Positioned(
            top: 14,
            left: 16,
            right: 16,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.white12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.satellite_alt, color: Color(0xFF60A5FA), size: 14),
                      const SizedBox(width: 6),
                      Text(
                        "RADAR GPS: ${_distanceKm.toStringAsFixed(1)} KM REMAINING",
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFF059669).withOpacity(0.3),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFF10B981)),
                  ),
                  child: Text(
                    _status.replaceAll('_', ' '),
                    style: const TextStyle(color: Color(0xFF34D399), fontSize: 10, fontWeight: FontWeight.w900),
                  ),
                ),
              ],
            ),
          ),

          // Visual Pin: Patient Location
          Positioned(
            left: 45,
            bottom: 45,
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF059669),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF10B981).withOpacity(0.6),
                        blurRadius: 12,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: const Icon(Icons.person_pin_circle, color: Colors.white, size: 20),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text("Patient", style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),

          // Visual Pin: Hospital Destination
          Positioned(
            right: 45,
            top: 55,
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.primary,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primary.withOpacity(0.5),
                        blurRadius: 12,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: const Icon(Icons.local_hospital, color: Colors.white, size: 20),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    widget.emergencyCase.hospitalName.split(' ').first,
                    style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),

          // Moving Ambulance Pin
          AnimatedBuilder(
            animation: _animController,
            builder: (context, child) {
              // Interpolate position along arc
              final t = (_animController.value * 0.4) + 0.3;
              final posX = 50 + t * 180;
              final posY = 170 - t * 80;

              return Positioned(
                left: posX,
                top: posY,
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0052FF),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0052FF).withOpacity(0.8),
                            blurRadius: 16,
                            spreadRadius: 3,
                          ),
                        ],
                      ),
                      child: const Icon(Icons.emergency, color: Colors.white, size: 20),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0052FF),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _vehicleId,
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildGreenCorridorCard(String lang) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF064E3B).withOpacity(0.4),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF059669).withOpacity(0.8)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(
              color: Color(0xFF059669),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.traffic, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  lang == 'hi' ? "ट्रैफिक पुलिस ग्रीन कॉरिडोर सक्रिय" : "TRAFFIC POLICE GREEN CORRIDOR",
                  style: const TextStyle(color: Color(0xFF34D399), fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 0.5),
                ),
                const SizedBox(height: 2),
                Text(
                  lang == 'hi'
                      ? "4 मुख्य जंक्शनों पर सिग्नल ग्रीन वेव से सिंक कर दिए गए हैं ताकि निर्बाध मार्ग मिल सके।"
                      : "Green corridor cleared across 4 major junctions along EM Bypass. Uninterrupted emergency transit active.",
                  style: const TextStyle(color: Colors.white70, fontSize: 11, height: 1.3),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTelemetryRow(String lang) {
    return Row(
      children: [
        Expanded(
          child: _telemetryTile(
            Icons.speed,
            "SPEED",
            "$_speedKmH km/h",
            const Color(0xFF60A5FA),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _telemetryTile(
            Icons.gas_meter,
            "OXYGEN RESERVE",
            "$_oxygenPct%",
            const Color(0xFF34D399),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _telemetryTile(
            Icons.battery_charging_full,
            "ICU POWER",
            "100% OK",
            const Color(0xFFFBBF24),
          ),
        ),
      ],
    );
  }

  Widget _telemetryTile(IconData icon, String label, String value, Color accent) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: accent, size: 18),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white38, letterSpacing: 0.5)),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: accent)),
        ],
      ),
    );
  }

  Widget _buildCrewCard(String lang) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("VEHICLE: $_vehicleId", style: const TextStyle(color: Color(0xFF60A5FA), fontWeight: FontWeight.w900, fontSize: 13, fontFamily: 'monospace')),
                  Text("$_vehicleType • $_regNumber", style: const TextStyle(color: Colors.white70, fontSize: 11)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text("ALS TIER-1", style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const Divider(height: 24, color: Color(0xFF1E293B)),

          // Driver
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.airline_seat_recline_normal, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_driverName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13)),
                    const Text("Emergency Evacuation Specialist", style: TextStyle(color: Colors.white60, fontSize: 11)),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => _callCrew(_driverPhone),
                icon: const Icon(Icons.phone_in_talk, color: Color(0xFF10B981), size: 20),
                style: IconButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981).withOpacity(0.15),
                  padding: const EdgeInsets.all(10),
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Paramedic
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.medical_information, color: Color(0xFF60A5FA), size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_paramedicName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13)),
                    Text(_paramedicRole, style: const TextStyle(color: Colors.white60, fontSize: 11), overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => _callCrew(_paramedicPhone),
                icon: const Icon(Icons.phone_in_talk, color: Color(0xFF60A5FA), size: 20),
                style: IconButton.styleFrom(
                  backgroundColor: const Color(0xFF0052FF).withOpacity(0.15),
                  padding: const EdgeInsets.all(10),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLifeSupportCard(String lang) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                lang == 'hi' ? "सत्यापित जीवन रक्षक उपकरण" : "VERIFIED ONBOARD LIFE-SUPPORT",
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.8),
              ),
              const Row(
                children: [
                  Icon(Icons.verified, color: Color(0xFF10B981), size: 14),
                  SizedBox(width: 4),
                  Text("ICU CERTIFIED", style: TextStyle(color: Color(0xFF10B981), fontSize: 9, fontWeight: FontWeight.w900)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          ..._equipmentList.map((eq) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                children: [
                  Icon(eq['icon'] as IconData, color: const Color(0xFF60A5FA), size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      eq['name'].toString(),
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      eq['status'].toString(),
                      style: const TextStyle(color: Color(0xFF34D399), fontSize: 9, fontWeight: FontWeight.w900),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _RadarGridPainter extends CustomPainter {
  final double progress;

  _RadarGridPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width * 0.45, size.height * 0.55);
    final maxRadius = math.min(size.width, size.height) * 0.7;

    final gridPaint = Paint()
      ..color = const Color(0xFF1E293B).withOpacity(0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    // Concentric circles
    for (int i = 1; i <= 3; i++) {
      canvas.drawCircle(center, (maxRadius / 3) * i, gridPaint);
    }

    // Cross lines
    canvas.drawLine(Offset(0, center.dy), Offset(size.width, center.dy), gridPaint);
    canvas.drawLine(Offset(center.dx, 0), Offset(center.dx, size.height), gridPaint);

    // Radar sweep
    final sweepPaint = Paint()
      ..shader = SweepGradient(
        center: FractionalOffset(center.dx / size.width, center.dy / size.height),
        startAngle: 0.0,
        endAngle: math.pi * 2,
        colors: [
          Colors.transparent,
          const Color(0xFF0052FF).withOpacity(0.0),
          const Color(0xFF0052FF).withOpacity(0.2),
          const Color(0xFF60A5FA).withOpacity(0.4),
        ],
        stops: const [0.0, 0.7, 0.95, 1.0],
        transform: GradientRotation(progress * math.pi * 2),
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..style = PaintingStyle.fill;

    canvas.drawCircle(center, maxRadius, sweepPaint);

    // Route line between Patient and Hospital
    final routePaint = Paint()
      ..color = const Color(0xFF0052FF).withOpacity(0.4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final start = const Offset(55, 205);
    final end = Offset(size.width - 55, 65);
    final control = Offset(size.width * 0.5, 120);

    final path = Path()
      ..moveTo(start.dx, start.dy)
      ..quadraticBezierTo(control.dx, control.dy, end.dx, end.dy);

    canvas.drawPath(path, routePaint);
  }

  @override
  bool shouldRepaint(covariant _RadarGridPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
