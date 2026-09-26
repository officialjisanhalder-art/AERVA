import 'package:url_launcher/url_launcher.dart';

class NavigationService {
  static Future<bool> launchGoogleMaps({
    required double destLat,
    required double destLng,
    double? originLat,
    double? originLng,
    String? hospitalName,
  }) async {
    // 1. First try native Android Google Maps navigation intent
    final navUri = Uri.parse('google.navigation:q=$destLat,$destLng&mode=d');
    try {
      if (await canLaunchUrl(navUri)) {
        return await launchUrl(navUri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {}

    // 2. Second try geo URI with query label
    final queryName = hospitalName != null ? Uri.encodeComponent(hospitalName) : '$destLat,$destLng';
    final geoUri = Uri.parse('geo:$destLat,$destLng?q=$destLat,$destLng($queryName)');
    try {
      if (await canLaunchUrl(geoUri)) {
        return await launchUrl(geoUri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {}

    // 3. Third try standard Google Maps directions URL
    final url = originLat != null && originLng != null
        ? 'https://www.google.com/maps/dir/?api=1&origin=$originLat,$originLng&destination=$destLat,$destLng&travelmode=driving'
        : 'https://www.google.com/maps/dir/?api=1&destination=$destLat,$destLng&travelmode=driving';
    final webUri = Uri.parse(url);

    try {
      return await launchUrl(webUri, mode: LaunchMode.externalApplication);
    } catch (_) {
      try {
        return await launchUrl(webUri, mode: LaunchMode.platformDefault);
      } catch (_) {
        return false;
      }
    }
  }

  static Future<bool> callHospital(String phone) async {
    final clean = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    final uri = Uri.parse('tel:$clean');
    try {
      if (await canLaunchUrl(uri)) {
        return await launchUrl(uri);
      }
      return false;
    } catch (_) {
      return false;
    }
  }
}
