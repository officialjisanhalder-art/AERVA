import 'dart:convert';
import 'dart:io';
import 'package:geolocator/geolocator.dart';

class LocationResult {
  final double lat;
  final double lng;
  final String area;
  final String city;
  final bool isGps;

  LocationResult({
    required this.lat,
    required this.lng,
    required this.area,
    required this.city,
    required this.isGps,
  });
}

class LocationService {
  static final List<LocationResult> popularLocations = [
    // Guwahati (Assam) Hubs
    LocationResult(
      lat: 26.1722,
      lng: 91.7458,
      area: 'Paltan Bazaar (Near Satribari)',
      city: 'Guwahati, Assam',
      isGps: false,
    ),
    LocationResult(
      lat: 26.1584,
      lng: 91.7704,
      area: 'Bhangagarh (Near GMCH)',
      city: 'Guwahati, Assam',
      isGps: false,
    ),
    LocationResult(
      lat: 26.1412,
      lng: 91.7345,
      area: 'Boragaon (Near Apollo Excelcare)',
      city: 'Guwahati, Assam',
      isGps: false,
    ),
    LocationResult(
      lat: 26.1860,
      lng: 91.7430,
      area: 'Panbazar (Near MMC Hospital)',
      city: 'Guwahati, Assam',
      isGps: false,
    ),
    LocationResult(
      lat: 26.1445,
      lng: 91.7898,
      area: 'Dispur / Ganeshguri',
      city: 'Guwahati, Assam',
      isGps: false,
    ),

    // Kolkata (West Bengal) Hubs
    LocationResult(
      lat: 22.5645,
      lng: 88.4069,
      area: 'Salt Lake City, Sector III (Near AMRI)',
      city: 'Kolkata, WB',
      isGps: false,
    ),
    LocationResult(
      lat: 22.5694,
      lng: 88.3986,
      area: 'Kadapara / EM Bypass (Near Apollo)',
      city: 'Kolkata, WB',
      isGps: false,
    ),
    LocationResult(
      lat: 22.5186,
      lng: 88.4042,
      area: 'Anandapur (Near Fortis)',
      city: 'Kolkata, WB',
      isGps: false,
    ),
    LocationResult(
      lat: 22.5510,
      lng: 88.3530,
      area: 'Park Street',
      city: 'Kolkata, WB',
      isGps: false,
    ),
  ];

  static Future<LocationResult?> getCurrentLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled()
          .timeout(const Duration(seconds: 2), onTimeout: () => false);
      if (!serviceEnabled) return null;

      LocationPermission permission = await Geolocator.checkPermission()
          .timeout(const Duration(seconds: 2), onTimeout: () => LocationPermission.denied);
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission()
            .timeout(const Duration(seconds: 5), onTimeout: () => LocationPermission.denied);
        if (permission == LocationPermission.denied) return null;
      }

      if (permission == LocationPermission.deniedForever) return null;

      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 4),
        ),
      ).timeout(const Duration(seconds: 5));

      final address = await _reverseGeocode(pos.latitude, pos.longitude);

      return LocationResult(
        lat: pos.latitude,
        lng: pos.longitude,
        area: address['area'] ?? 'Current GPS Location',
        city: address['city'] ?? 'Detected Region',
        isGps: true,
      );
    } catch (_) {
      return null;
    }
  }

  static Future<Map<String, String>> _reverseGeocode(double lat, double lng) async {
    try {
      final client = HttpClient();
      client.connectionTimeout = const Duration(seconds: 3);
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng&zoom=16&addressdetails=1',
      );
      final request = await client.getUrl(uri);
      request.headers.set('User-Agent', 'AERVA-EmergencyApp/2.0 (health-dispatch)');
      final response = await request.close();
      if (response.statusCode == 200) {
        final body = await response.transform(utf8.decoder).join();
        final json = jsonDecode(body) as Map<String, dynamic>;
        final addr = json['address'] as Map<String, dynamic>?;
        if (addr != null) {
          final neighbourhood = addr['neighbourhood'] ??
              addr['suburb'] ??
              addr['residential'] ??
              addr['road'] ??
              addr['hamlet'];
          final city = addr['city'] ??
              addr['town'] ??
              addr['state_district'] ??
              addr['state'] ??
              'India';
          if (neighbourhood != null) {
            return {
              'area': neighbourhood.toString(),
              'city': city.toString(),
            };
          }
        }
      }
    } catch (_) {}

    // Fallback: Coordinate boundary detection
    if (lat >= 26.0 && lat <= 26.3 && lng >= 91.5 && lng <= 92.0) {
      return {'area': 'Guwahati Metro', 'city': 'Assam'};
    } else if (lat >= 22.4 && lat <= 22.7 && lng >= 88.2 && lng <= 88.6) {
      return {'area': 'Salt Lake / EM Bypass', 'city': 'Kolkata'};
    }

    return {'area': 'Emergency GPS Pin', 'city': 'Live Region'};
  }
}
