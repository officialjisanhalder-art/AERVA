import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../services/location_service.dart';
import '../../services/storage_service.dart';
import 'hospital_discovery_screen.dart';

class LocationCaptureScreen extends StatefulWidget {
  const LocationCaptureScreen({super.key});

  @override
  State<LocationCaptureScreen> createState() => _LocationCaptureScreenState();
}

class _LocationCaptureScreenState extends State<LocationCaptureScreen> {
  bool _isDetecting = true;
  LocationResult? _location;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _detectLocation();
  }

  Future<void> _detectLocation() async {
    setState(() {
      _isDetecting = true;
      _errorMessage = null;
    });

    final loc = await LocationService.getCurrentLocation();
    if (loc != null) {
      if (mounted) {
        setState(() {
          _location = loc;
          _isDetecting = false;
        });
        await StorageService.saveDraft({
          'locationArea': loc.area,
          'locationCity': loc.city,
          'originLat': loc.lat,
          'originLng': loc.lng,
        });
      }
    } else {
      // Fallback to default prominent locality (Salt Lake, Kolkata)
      final fallback = LocationService.popularLocations.first;
      if (mounted) {
        setState(() {
          _location = fallback;
          _isDetecting = false;
          _errorMessage = "GPS unavailable or denied. Location set to default area.";
        });
        await StorageService.saveDraft({
          'locationArea': fallback.area,
          'locationCity': fallback.city,
          'originLat': fallback.lat,
          'originLng': fallback.lng,
        });
      }
    }
  }

  void _showManualLocationPicker() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Select Emergency Origin", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
            const SizedBox(height: 4),
            const Text("Choose your approximate locality for hospital dispatch", style: TextStyle(color: Color(0xFF64748B), fontSize: 12)),
            const SizedBox(height: 16),
            ...LocationService.popularLocations.map((loc) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFEEF3FF), borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.location_on, color: AppTheme.primary, size: 20),
              ),
              title: Text(loc.area, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              subtitle: Text(loc.city, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14),
              onTap: () async {
                setState(() {
                  _location = loc;
                  _errorMessage = null;
                });
                await StorageService.saveDraft({
                  'locationArea': loc.area,
                  'locationCity': loc.city,
                  'originLat': loc.lat,
                  'originLng': loc.lng,
                });
                Navigator.pop(ctx);
              },
            )),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text("Live Location"),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Progress Stepper indicator
              Row(
                children: [
                  _stepDot("1. Location", true),
                  _stepLine(),
                  _stepDot("2. Hospitals", false),
                  _stepLine(),
                  _stepDot("3. Triage", false),
                ],
              ),
              const SizedBox(height: 28),

              if (_isDetecting) ...[
                const SizedBox(height: 60),
                const Center(
                  child: Column(
                    children: [
                      SizedBox(
                        width: 50,
                        height: 50,
                        child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 3),
                      ),
                      SizedBox(height: 24),
                      Text("Detecting your live location...", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                      SizedBox(height: 8),
                      Text("Requesting high-accuracy GPS coordinates...", style: TextStyle(color: Color(0xFF64748B), fontSize: 13)),
                      SizedBox(height: 24),
                    ],
                  ),
                ),
                TextButton.icon(
                  onPressed: () async {
                    final fallback = LocationService.popularLocations.first;
                    setState(() {
                      _location = fallback;
                      _isDetecting = false;
                    });
                    await StorageService.saveDraft({
                      'locationArea': fallback.area,
                      'locationCity': fallback.city,
                      'originLat': fallback.lat,
                      'originLng': fallback.lng,
                    });
                  },
                  icon: const Icon(Icons.near_me, size: 16),
                  label: const Text("Use Default Location (Salt Lake, Kolkata)"),
                ),
                const SizedBox(height: 30),
              ] else if (_location != null) ...[
                // Success Badge (PRD Section 3)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFECFDF5),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFA7F3D0)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.check_circle, color: Color(0xFF059669), size: 16),
                      SizedBox(width: 6),
                      Text(
                        "LIVE LOCATION CAPTURED",
                        style: TextStyle(color: Color(0xFF059669), fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                Text(
                  _location!.area,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppTheme.darkNavy),
                ),
                Text(
                  _location!.city,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 20),

                // Radar Map Preview with Grid & Center Pin
                Container(
                  width: double.infinity,
                  height: 200,
                  clipBehavior: Clip.antiAlias,
                  decoration: BoxDecoration(
                    color: const Color(0xFF050B18),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFF1E293B)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.15),
                        blurRadius: 12,
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
                      // Radial circles
                      Center(
                        child: Container(
                          width: 160,
                          height: 160,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: AppTheme.primary.withOpacity(0.2), width: 1.5),
                          ),
                        ),
                      ),
                      Center(
                        child: Container(
                          width: 90,
                          height: 90,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: AppTheme.primary.withOpacity(0.35), width: 1.5),
                          ),
                        ),
                      ),
                      // Blinking Pin
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
                                  BoxShadow(color: const Color(0xFF059669).withOpacity(0.6), blurRadius: 15, spreadRadius: 3),
                                ],
                              ),
                              child: const Icon(Icons.my_location, color: Colors.white, size: 20),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
                              child: Text(
                                "${_location!.lat.toStringAsFixed(4)}, ${_location!.lng.toStringAsFixed(4)}",
                                style: const TextStyle(color: Colors.white70, fontSize: 10, fontFamily: "monospace"),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Positioned(
                        bottom: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(color: const Color(0xFF059669).withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                          child: const Text("LIVE LOCATION ACTIVE", style: TextStyle(color: Color(0xFF34D399), fontSize: 10, fontWeight: FontWeight.w900)),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Manual map override option (PRD Section 4)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton.icon(
                      onPressed: _detectLocation,
                      icon: const Icon(Icons.refresh, size: 16),
                      label: const Text("Refresh GPS", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                    TextButton.icon(
                      onPressed: _showManualLocationPicker,
                      icon: const Icon(Icons.map, size: 16),
                      label: const Text("Change Area", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Proceed CTA
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => HospitalDiscoveryScreen(location: _location!),
                      ),
                    );
                  },
                  child: const FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text("CONTINUE TO NEARBY HOSPITALS →"),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _stepDot(String label, bool active) {
    return Column(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: active ? AppTheme.primary : const Color(0xFFE2E8F0),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Icon(Icons.check, size: 14, color: active ? Colors.white : const Color(0xFF94A3B8)),
          ),
        ),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 10, fontWeight: active ? FontWeight.w900 : FontWeight.w600, color: active ? AppTheme.darkNavy : const Color(0xFF94A3B8))),
      ],
    );
  }

  Widget _stepLine() {
    return Expanded(
      child: Container(
        height: 2,
        color: const Color(0xFFE2E8F0),
        margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
      ),
    );
  }
}
