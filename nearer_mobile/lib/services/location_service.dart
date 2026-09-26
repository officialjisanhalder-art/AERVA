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
    LocationResult(lat: 22.5645, lng: 88.4069, area: 'Salt Lake City, Sector III (Near AMRI)', city: 'Kolkata', isGps: false),
    LocationResult(lat: 22.5830, lng: 88.4230, area: 'Salt Lake, Sector III', city: 'Kolkata', isGps: false),
    LocationResult(lat: 22.5510, lng: 88.3530, area: 'Park Street', city: 'Kolkata', isGps: false),
    LocationResult(lat: 22.5890, lng: 88.4750, area: 'Action Area I, New Town', city: 'Kolkata', isGps: false),
    LocationResult(lat: 22.5726, lng: 88.4339, area: 'Sector V, Electronics Complex', city: 'Kolkata', isGps: false),
    LocationResult(lat: 22.5342, lng: 88.3308, area: 'Alipore', city: 'Kolkata', isGps: false),
    LocationResult(lat: 22.5958, lng: 88.2636, area: 'Howrah Railway Terminus', city: 'Howrah', isGps: false),
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
          timeLimit: Duration(seconds: 3),
        ),
      ).timeout(const Duration(seconds: 4));

      final address = await _reverseGeocode(pos.latitude, pos.longitude);

      return LocationResult(
        lat: pos.latitude,
        lng: pos.longitude,
        area: address['area'] ?? 'Salt Lake City, Sector III',
        city: address['city'] ?? 'Kolkata',
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
      request.headers.set('User-Agent', 'NearER-EmergencyApp/2.0 (health-dispatch)');
      final response = await request.close();
      if (response.statusCode == 200) {
        final body = await response.transform(utf8.decoder).join();
        final json = jsonDecode(body) as Map<String, dynamic>;
        final addr = json['address'] as Map<String, dynamic>?;
        if (addr != null) {
          final neighbourhood = addr['neighbourhood'] ?? addr['suburb'] ?? addr['residential'] ?? addr['road'];
          final city = addr['city'] ?? addr['town'] ?? addr['state_district'] ?? 'Kolkata';
          if (neighbourhood != null) {
            return {
              'area': neighbourhood.toString(),
              'city': city.toString(),
            };
          }
        }
      }
    } catch (_) {}

    // Fallback: Intelligent locality resolution based on coordinates
    if (lat >= 22.56 && lat <= 22.59 && lng >= 22.39 && lng <= 88.44) {
      return {'area': 'Salt Lake City, Sector III', 'city': 'Kolkata'};
    } else if (lat >= 22.52 && lat <= 22.55 && lng >= 88.31 && lng <= 88.35) {
      return {'area': 'Alipore', 'city': 'Kolkata'};
    } else if (lat >= 22.54 && lat <= 22.56 && lng >= 88.34 && lng <= 88.38) {
      return {'area': 'Park Street / Central', 'city': 'Kolkata'};
    } else if (lat >= 22.57 && lat <= 22.61 && lng >= 88.44 && lng <= 88.49) {
      return {'area': 'New Town Action Area', 'city': 'Kolkata'};
    }

    return {
      'area': 'Bidhannagar / Salt Lake',
      'city': 'Kolkata',
    };
  }
}
