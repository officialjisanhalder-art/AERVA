import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../models/hospital.dart';
import '../../services/location_service.dart';
import '../../services/navigation_service.dart';
import '../../services/i18n_service.dart';
import 'emergency_intake_screen.dart';

import '../../services/supabase_sync_service.dart';

class HospitalDiscoveryScreen extends StatefulWidget {
  final LocationResult location;
  const HospitalDiscoveryScreen({super.key, required this.location});

  @override
  State<HospitalDiscoveryScreen> createState() => _HospitalDiscoveryScreenState();
}

class _HospitalDiscoveryScreenState extends State<HospitalDiscoveryScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final List<Hospital> _hospitals = Hospital.getHospitals();
  Hospital? _selectedHospital;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _selectedHospital = _hospitals.first;

    // Realtime Supabase Capacity Listener
    SupabaseSyncService.subscribeToHospitalCapacity((data) {
      if (!mounted) return;
      final hospitalId = data['hospitalId']?.toString();
      final erAvailable = data['erBedsAvailable'];
      final erTotal = data['erBedsTotal'];
      final icuAvailable = data['icuBedsAvailable'];
      final docName = data['doctorInChargeName']?.toString();

      setState(() {
        final idx = _hospitals.indexWhere((h) => h.id == hospitalId);
        if (idx != -1) {
          _hospitals[idx] = _hospitals[idx].copyWith(
            erAvailable: erAvailable != null ? (erAvailable as num).toInt() : null,
            erTotal: erTotal != null ? (erTotal as num).toInt() : null,
            icuAvailable: icuAvailable != null ? (icuAvailable as num).toInt() : null,
            doctorName: docName,
            lastUpdated: 'Just now (Live)',
          );
          if (_selectedHospital?.id == hospitalId) {
            _selectedHospital = _hospitals[idx];
          }
        }
      });
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: I18nService.currentLang,
      builder: (context, lang, _) {
        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            title: Text(I18nService.t('emergency.nearbyTitle')),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, size: 18),
              onPressed: () => Navigator.pop(context),
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
              const SizedBox(width: 8),
            ],
            bottom: TabBar(
              controller: _tabController,
              labelColor: AppTheme.primary,
              indicatorColor: AppTheme.primary,
              unselectedLabelColor: const Color(0xFF64748B),
              labelStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
              tabs: const [
                Tab(icon: Icon(Icons.map_outlined, size: 18), text: "MAP VIEW"),
                Tab(icon: Icon(Icons.format_list_bulleted, size: 18), text: "LIST VIEW"),
              ],
            ),
          ),
          body: SafeArea(
        child: Column(
          children: [
            // Top origin banner
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: Colors.white,
              child: Row(
                children: [
                  const Icon(Icons.my_location, size: 16, color: Color(0xFF059669)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      "From: ${widget.location.area}, ${widget.location.city}",
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF0F172A)),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: const Color(0xFFEEF3FF), borderRadius: BorderRadius.circular(6)),
                    child: Text("${_hospitals.length} Found", style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w900, fontSize: 11)),
                  ),
                ],
              ),
            ),

            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _mapView(),
                  _listView(),
                ],
              ),
            ),

            // Fixed Proceed Button
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => EmergencyIntakeScreen(location: widget.location),
                      ),
                    );
                  },
                  child: const Text("PROCEED TO EMERGENCY TRIAGE →"),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  },
);
}

  Widget _mapView() {
    return Column(
      children: [
        // Dark Full-Width Radar Map Simulation
        Expanded(
          child: Container(
            width: double.infinity,
            margin: const EdgeInsets.all(16),
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              color: const Color(0xFF050B18),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF1E293B)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.2),
                  blurRadius: 15,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Stack(
              fit: StackFit.expand,
              alignment: Alignment.center,
              children: [
                // Radar grid crosshairs
                Center(
                  child: Container(
                    width: double.infinity,
                    height: 1,
                    color: Colors.white.withOpacity(0.06),
                  ),
                ),
                Center(
                  child: Container(
                    width: 1,
                    height: double.infinity,
                    color: Colors.white.withOpacity(0.06),
                  ),
                ),

                // Concentric Range Rings
                Center(
                  child: Container(
                    width: 270,
                    height: 270,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppTheme.primary.withOpacity(0.18), width: 1.2),
                    ),
                  ),
                ),
                Center(
                  child: Container(
                    width: 180,
                    height: 180,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppTheme.primary.withOpacity(0.25), width: 1.2),
                    ),
                  ),
                ),
                Center(
                  child: Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFF059669).withOpacity(0.35), width: 1.2),
                    ),
                  ),
                ),

                // Range labels
                Positioned(
                  top: 14,
                  left: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.radar, color: Color(0xFF38BDF8), size: 12),
                        SizedBox(width: 4),
                        Text(
                          "LIVE 5KM ER RADAR",
                          style: TextStyle(color: Color(0xFF38BDF8), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 0.8),
                        ),
                      ],
                    ),
                  ),
                ),

                // Center user pin
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF059669),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF059669).withOpacity(0.6),
                              blurRadius: 14,
                              spreadRadius: 3,
                            ),
                          ],
                        ),
                        child: const Icon(Icons.my_location, color: Colors.white, size: 18),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.black87,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: const Color(0xFF059669).withOpacity(0.5)),
                        ),
                        child: const Text(
                          "YOU (Origin)",
                          style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900),
                        ),
                      ),
                    ],
                  ),
                ),

                // Dynamic Hospital pins distributed around radar
                if (_hospitals.isNotEmpty)
                  Positioned(
                    top: 50,
                    left: 20,
                    child: _mapPin(_hospitals[0]),
                  ),
                if (_hospitals.length > 1)
                  Positioned(
                    top: 40,
                    right: 25,
                    child: _mapPin(_hospitals[1]),
                  ),
                if (_hospitals.length > 2)
                  Positioned(
                    bottom: 45,
                    left: 30,
                    child: _mapPin(_hospitals[2]),
                  ),
                if (_hospitals.length > 3)
                  Positioned(
                    bottom: 55,
                    right: 20,
                    child: _mapPin(_hospitals[3]),
                  ),
                if (_hospitals.length > 4)
                  Positioned(
                    top: 130,
                    right: 15,
                    child: _mapPin(_hospitals[4]),
                  ),
              ],
            ),
          ),
        ),

        // Selected Hospital preview card below map
        if (_selectedHospital != null)
          Container(
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.primary.withOpacity(0.35)),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 12, offset: const Offset(0, 4)),
              ],
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEF3FF),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.local_hospital, color: AppTheme.primary, size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_selectedHospital!.name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                          Text(
                            "${_selectedHospital!.distanceKm} km • ${_selectedHospital!.etaMinutes} mins away • ${_selectedHospital!.address}",
                            style: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            children: [
                              _badge("${_selectedHospital!.erAvailable} ER Beds", const Color(0xFF059669)),
                              _badge("${_selectedHospital!.icuAvailable} ICU Beds", AppTheme.primary),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: const Color(0xFFEEF3FF), borderRadius: BorderRadius.circular(6)),
                  child: Text(
                    "Attending Lead: ${_selectedHospital!.doctorInChargeName} (${_selectedHospital!.doctorInChargeRole})",
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.primary),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(height: 8),
                // Direct Google Maps Route button
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      NavigationService.launchGoogleMaps(
                        destLat: _selectedHospital!.lat,
                        destLng: _selectedHospital!.lng,
                        originLat: widget.location.lat,
                        originLng: widget.location.lng,
                        hospitalName: _selectedHospital!.name,
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primary,
                      side: const BorderSide(color: AppTheme.primary),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.directions, size: 16),
                    label: Text(
                      "Navigate to ${_selectedHospital!.name.split(' ')[0]} via Google Maps",
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _mapPin(Hospital h) {
    final isSel = _selectedHospital?.id == h.id;
    return GestureDetector(
      onTap: () => setState(() => _selectedHospital = h),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: isSel ? AppTheme.primary : const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isSel ? Colors.white : Colors.white24,
                width: isSel ? 1.8 : 1.0,
              ),
              boxShadow: isSel
                  ? [BoxShadow(color: AppTheme.primary.withOpacity(0.7), blurRadius: 10, spreadRadius: 2)]
                  : null,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.local_hospital, size: 10, color: isSel ? Colors.white : const Color(0xFF38BDF8)),
                    const SizedBox(width: 4),
                    Text(
                      h.name.length > 14 ? "${h.name.substring(0, 14)}..." : h.name,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: isSel ? FontWeight.w900 : FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      "${h.etaMinutes}m",
                      style: const TextStyle(color: Color(0xFF34D399), fontSize: 9, fontWeight: FontWeight.w900),
                    ),
                    const Text(" • ", style: TextStyle(color: Colors.white38, fontSize: 8)),
                    Text(
                      "${h.erAvailable} ER beds",
                      style: const TextStyle(color: Colors.white70, fontSize: 8, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 2),
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(
              color: isSel ? Colors.white : const Color(0xFF38BDF8),
              shape: BoxShape.circle,
            ),
          ),
        ],
      ),
    );
  }

  Widget _listView() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _hospitals.length,
      itemBuilder: (ctx, i) {
        final h = _hospitals[i];
        return Container(
          margin: const EdgeInsets.only(bottom: 14),
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
                  Flexible(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.verified, size: 12, color: Color(0xFF059669)),
                          SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              "NearER Verified",
                              style: TextStyle(color: Color(0xFF059669), fontSize: 10, fontWeight: FontWeight.bold),
                              overflow: TextOverflow.ellipsis,
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
                      color: const Color(0xFF050B18),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text("${h.distanceKm} km • ${h.etaMinutes} mins", style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(h.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.darkNavy)),
              Text(h.type, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              // ER and ICU availability row
              Row(
                children: [
                  _statusBox("ER STATUS", "${h.erAvailable} Available", h.erAvailable > 0 ? const Color(0xFF059669) : const Color(0xFF64748B)),
                  const SizedBox(width: 10),
                  _statusBox("ICU BEDS", "${h.icuAvailable} Open", h.icuAvailable > 0 ? AppTheme.primary : const Color(0xFF64748B)),
                  const SizedBox(width: 10),
                  _statusBox("FRESHNESS", h.lastUpdated, const Color(0xFF64748B)),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFEEF3FF),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFD0E1FD)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.person_pin, size: 14, color: AppTheme.primary),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        "Doctor in Charge: ${h.doctorInChargeName} (${h.doctorInChargeRole})",
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              // Specialist tags
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: h.specialists.map((s) => Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(6)),
                  child: Text(s, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF475569))),
                )).toList(),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _statusBox(String title, String val, Color col) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
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

  Widget _badge(String text, Color col) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: col.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
      child: Text(text, style: TextStyle(color: col, fontWeight: FontWeight.bold, fontSize: 10)),
    );
  }
}
