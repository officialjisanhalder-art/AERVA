import 'dart:math';

class Hospital {
  final String id;
  final String name;
  final String type;
  final double distanceKm;
  final int etaMinutes;
  final int? erAvailable;
  final int? erTotal;
  final int? icuAvailable;
  final int? icuTotal;
  final List<String> specialists;
  final Map<String, String> bloodBank;
  final String lastUpdated;
  final bool isVerified;
  final String verificationStatus; // 'aerva_verified' | 'website_information_found' | 'unverified' | 'unknown_or_stale'
  final List<String> websiteFacilities;
  final String? websiteUrl;
  final String phone;
  final double lat;
  final double lng;
  final String address;
  final List<String> primaryCapabilities;
  final String doctorInChargeName;
  final String doctorInChargeRole;
  final String doctorInChargeShift;

  Hospital({
    required this.id,
    required this.name,
    required this.type,
    required this.distanceKm,
    required this.etaMinutes,
    this.erAvailable,
    this.erTotal,
    this.icuAvailable,
    this.icuTotal,
    required this.specialists,
    required this.bloodBank,
    required this.lastUpdated,
    required this.isVerified,
    this.verificationStatus = 'aerva_verified',
    this.websiteFacilities = const [],
    this.websiteUrl,
    required this.phone,
    required this.lat,
    required this.lng,
    required this.address,
    required this.primaryCapabilities,
    this.doctorInChargeName = "Chief Medical Officer",
    this.doctorInChargeRole = "Emergency Response Lead",
    this.doctorInChargeShift = "Active On-Duty Shift",
  });

  bool get isAervaVerified => verificationStatus == 'aerva_verified' || (isVerified && verificationStatus.isEmpty);
  bool get isWebsiteFound => verificationStatus == 'website_information_found';
  bool get isUnverified => verificationStatus == 'unverified';
  bool get hasLiveBedTelemetry => isAervaVerified && erAvailable != null && erAvailable! > 0;

  Hospital withReservedBed() {
    return Hospital(
      id: id,
      name: name,
      type: type,
      distanceKm: distanceKm,
      etaMinutes: etaMinutes,
      erAvailable: erAvailable != null ? (erAvailable! - 1).clamp(0, erTotal ?? 99) : null,
      erTotal: erTotal,
      icuAvailable: icuAvailable,
      icuTotal: icuTotal,
      specialists: specialists,
      bloodBank: bloodBank,
      lastUpdated: 'Just now (Updated)',
      isVerified: isVerified,
      verificationStatus: verificationStatus,
      websiteFacilities: websiteFacilities,
      websiteUrl: websiteUrl,
      phone: phone,
      lat: lat,
      lng: lng,
      address: address,
      primaryCapabilities: primaryCapabilities,
      doctorInChargeName: doctorInChargeName,
      doctorInChargeRole: doctorInChargeRole,
      doctorInChargeShift: doctorInChargeShift,
    );
  }

  Hospital copyWith({
    int? erAvailable,
    int? erTotal,
    int? icuAvailable,
    int? icuTotal,
    String? lastUpdated,
    String? doctorName,
    String? doctorRole,
    double? distanceKm,
    int? etaMinutes,
    String? verificationStatus,
  }) {
    return Hospital(
      id: id,
      name: name,
      type: type,
      distanceKm: distanceKm ?? this.distanceKm,
      etaMinutes: etaMinutes ?? this.etaMinutes,
      erAvailable: erAvailable ?? this.erAvailable,
      erTotal: erTotal ?? this.erTotal,
      icuAvailable: icuAvailable ?? this.icuAvailable,
      icuTotal: icuTotal ?? this.icuTotal,
      specialists: specialists,
      bloodBank: bloodBank,
      lastUpdated: lastUpdated ?? this.lastUpdated,
      isVerified: isVerified,
      verificationStatus: verificationStatus ?? this.verificationStatus,
      websiteFacilities: websiteFacilities,
      websiteUrl: websiteUrl,
      phone: phone,
      lat: lat,
      lng: lng,
      address: address,
      primaryCapabilities: primaryCapabilities,
      doctorInChargeName: doctorName ?? doctorInChargeName,
      doctorInChargeRole: doctorRole ?? doctorInChargeRole,
      doctorInChargeShift: doctorInChargeShift,
    );
  }

  /// Haversine Great Circle Distance Formula (Kilometers)
  static double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
    const p = 0.017453292519943295; // Math.PI / 180
    final a = 0.5 -
        cos((lat2 - lat1) * p) / 2 +
        cos(lat1 * p) * cos(lat2 * p) * (1 - cos((lon2 - lon1) * p)) / 2;
    return 12742 * asin(sqrt(a.clamp(0.0, 1.0))); // 2 * R, R = 6371 km
  }

  /// Global & Geofenced Hospital Registry with Live Verified Telemetry
  static List<Hospital> getHospitals({
    double? originLat,
    double? originLng,
    double geofenceRadiusKm = 50.0,
    bool filterByGeofence = false,
  }) {
    final rawList = [
      // ==========================================
      // GUWAHATI (ASSAM) REGISTRY
      // ==========================================
      Hospital(
        id: 'gmch',
        name: 'Gauhati Medical College and Hospital (GMCH)',
        type: 'Apex Government Super Specialty & Trauma Center',
        distanceKm: 4.0,
        etaMinutes: 10,
        erAvailable: 16,
        erTotal: 40,
        icuAvailable: 6,
        icuTotal: 20,
        specialists: ['Trauma Surgeon', 'Cardiologist', 'Emergency Physician', 'Neurosurgeon'],
        bloodBank: {'O+': 'Available (24 Units)', 'O-': 'Available (8 Units)', 'A+': 'Available', 'B+': 'Available'},
        lastUpdated: '1 min ago',
        isVerified: true,
        verificationStatus: 'aerva_verified',
        phone: '+91 361 252 9457',
        lat: 26.1584,
        lng: 91.7704,
        address: 'Narakasur Hilltop, Bhangagarh, Guwahati, Assam 781032',
        primaryCapabilities: ['Trauma', 'Cardiac', 'Breathing Emergency', 'Critical Resuscitation'],
        doctorInChargeName: 'Prof. Dr. Bhaskar Jyoti Sharma',
        doctorInChargeRole: 'HOD Emergency Medicine & Critical Care Lead',
        doctorInChargeShift: 'Emergency Trauma Day Lead (08:00 - 20:00)',
      ),
      Hospital(
        id: 'satribari',
        name: 'Satribari Christian Hospital',
        type: 'Charitable Emergency & Multi-Specialty Hospital',
        distanceKm: 2.4,
        etaMinutes: 7,
        erAvailable: 8,
        erTotal: 20,
        icuAvailable: 4,
        icuTotal: 10,
        specialists: ['Emergency Medical Officer', 'General Surgeon', 'Pediatrician', 'Critical Care'],
        bloodBank: {'O+': 'Available (12 Units)', 'O-': 'Available (4 Units)', 'B+': 'Available'},
        lastUpdated: 'Just now',
        isVerified: true,
        verificationStatus: 'aerva_verified',
        phone: '+91 361 260 0015',
        lat: 26.1722,
        lng: 91.7458,
        address: 'Satribari Road, Paltan Bazaar, Guwahati, Assam 781008',
        primaryCapabilities: ['Cardiac', 'General Emergency', 'Maternity', 'Breathing Emergency'],
        doctorInChargeName: 'Dr. Ananya Baruah',
        doctorInChargeRole: 'Senior Emergency Physician & Triage Head',
        doctorInChargeShift: 'Active Emergency Shift (On Duty)',
      ),
      Hospital(
        id: 'apollo_ghy',
        name: 'Apollo Excelcare Hospital',
        type: 'Tertiary Quaternary Care & Advanced Cardiac Center',
        distanceKm: 6.2,
        etaMinutes: 14,
        erAvailable: 12,
        erTotal: 25,
        icuAvailable: 5,
        icuTotal: 12,
        specialists: ['Interventional Cardiologist', 'Trauma Specialist', 'Stroke Neurologist', 'Pulmonologist'],
        bloodBank: {'O+': 'Available (18 Units)', 'A+': 'Available', 'AB+': 'Available', 'O-': 'Limited (2 Units)'},
        lastUpdated: '3 min ago',
        isVerified: true,
        verificationStatus: 'aerva_verified',
        phone: '+91 361 716 0000',
        lat: 26.1412,
        lng: 91.7345,
        address: 'Paschim Boragaon, NH-37 Bypass, Guwahati, Assam 781033',
        primaryCapabilities: ['Cardiac', 'Stroke', 'Trauma', 'Neurology', 'Breathing Emergency'],
        doctorInChargeName: 'Dr. Partha Pratim Das',
        doctorInChargeRole: 'Chief Emergency Consultant',
        doctorInChargeShift: 'Emergency Department Head Shift',
      ),
      Hospital(
        id: 'marwari_ghy',
        name: 'Marwari Hospitals',
        type: 'Community Hospital (Google Places Discovery)',
        distanceKm: 3.1,
        etaMinutes: 9,
        erAvailable: null, // ZERO FABRICATION
        erTotal: null,
        icuAvailable: null,
        icuTotal: null,
        specialists: ['General Practitioner', 'General Medicine'],
        bloodBank: {'O+': 'Inquire at counter'},
        lastUpdated: 'Discovered via Google Places',
        isVerified: false,
        verificationStatus: 'unverified',
        phone: '+91 361 260 2784',
        lat: 26.1780,
        lng: 91.7410,
        address: 'Sati Jaimati Road, Athgaon, Guwahati, Assam 781001',
        primaryCapabilities: ['General Emergency'],
        doctorInChargeName: 'Unregistered with AERVA',
        doctorInChargeRole: 'Live telemetry not connected',
        doctorInChargeShift: 'Unverified facility',
      ),
      Hospital(
        id: 'mmc_ghy',
        name: 'Mahendra Mohan Choudhury Hospital (MMC)',
        type: 'Civil District Hospital (OpenStreetMap Discovery)',
        distanceKm: 2.8,
        etaMinutes: 8,
        erAvailable: null, // ZERO FABRICATION
        erTotal: null,
        icuAvailable: null,
        icuTotal: null,
        specialists: ['Casualty Medical Officer'],
        bloodBank: {},
        lastUpdated: 'Discovered via OSM Directory',
        isVerified: false,
        verificationStatus: 'unverified',
        phone: '+91 361 254 3998',
        lat: 26.1860,
        lng: 91.7430,
        address: 'MG Road, Panbazar, Guwahati, Assam 781001',
        primaryCapabilities: ['Casualty'],
        doctorInChargeName: 'Unregistered with AERVA',
        doctorInChargeRole: 'Live telemetry not connected',
        doctorInChargeShift: 'Unverified facility',
      ),
      Hospital(
        id: 'city_care_web',
        name: 'City Care Emergency Clinic',
        type: 'Public Web Discovery (Browser Use Cloud)',
        distanceKm: 3.5,
        etaMinutes: 10,
        erAvailable: null, // ZERO FABRICATION - Web listed != live available
        erTotal: null,
        icuAvailable: null,
        icuTotal: null,
        specialists: ['Listed 24/7 Emergency Care', 'Critical Care Support'],
        bloodBank: {},
        lastUpdated: 'Browser Use Cloud (2h ago)',
        isVerified: false,
        verificationStatus: 'website_information_found',
        websiteFacilities: ['Listed 24/7 Emergency Department', 'Listed ICU Unit', 'Oxygen Support Available'],
        websiteUrl: 'https://citycare-emergency.example.org',
        phone: '+91 361 245 1199',
        lat: 26.1650,
        lng: 91.7550,
        address: 'GS Road, Dispur, Guwahati, Assam 781005',
        primaryCapabilities: ['Emergency Care', 'Breathing Emergency'],
        doctorInChargeName: 'Website Discovery Provenance',
        doctorInChargeRole: 'Public web listing - not live telemetry',
        doctorInChargeShift: 'Website Information Found',
      ),

      // ==========================================
      // KOLKATA (WEST BENGAL) REGISTRY
      // ==========================================
      Hospital(
        id: 'h1',
        name: 'Apollo Multispeciality Hospitals',
        type: 'Level 1 Trauma & Super Specialty Center',
        distanceKm: 2.5,
        etaMinutes: 7,
        erAvailable: 14,
        erTotal: 30,
        icuAvailable: 4,
        icuTotal: 18,
        specialists: ['Cardiologist', 'General Surgeon', 'Trauma Specialist'],
        bloodBank: {'O+': 'Available (16 Units)', 'O-': 'Available (4 Units)', 'A+': 'Available'},
        lastUpdated: '2 min ago',
        isVerified: true,
        verificationStatus: 'aerva_verified',
        phone: '+91 33 2320 3040',
        lat: 22.5694,
        lng: 88.3986,
        address: '58 Canal Circular Road, Kadapara, Kolkata',
        primaryCapabilities: ['Trauma', 'Cardiac', 'Breathing Emergency'],
        doctorInChargeName: 'Dr. Sandip Sengupta',
        doctorInChargeRole: 'Chief Medical Officer & ER Lead',
        doctorInChargeShift: 'Day Shift (08:00 - 20:00)',
      ),
      Hospital(
        id: 'h2',
        name: 'AMRI Hospital Salt Lake',
        type: 'Super Specialty Hospital & Cardiac Center',
        distanceKm: 3.2,
        etaMinutes: 9,
        erAvailable: 8,
        erTotal: 20,
        icuAvailable: 5,
        icuTotal: 12,
        specialists: ['Cardiologist', 'Neurologist', 'Cardiac Surgeon', 'Critical Care'],
        bloodBank: {'O+': 'Available (10 Units)', 'O-': 'Available (3 Units)', 'A+': 'Available', 'AB+': 'Available'},
        lastUpdated: 'Just now',
        isVerified: true,
        verificationStatus: 'aerva_verified',
        phone: '+91 33 2335 7710',
        lat: 22.5645,
        lng: 88.4069,
        address: 'JC - 16 & 17, Sector III, Salt Lake City, Kolkata',
        primaryCapabilities: ['Cardiac', 'Stroke', 'Breathing Emergency', 'Trauma'],
        doctorInChargeName: 'Dr. Debashis Roy',
        doctorInChargeRole: 'Senior Consultant - Emergency Triage',
        doctorInChargeShift: 'Active Emergency Shift (On Duty)',
      ),
      Hospital(
        id: 'h4',
        name: 'Fortis Hospital Anandapur',
        type: 'Tertiary Quaternary Care Center',
        distanceKm: 4.8,
        etaMinutes: 12,
        erAvailable: 10,
        erTotal: 24,
        icuAvailable: 4,
        icuTotal: 14,
        specialists: ['Trauma Surgeon', 'Critical Care Specialist', 'Neurologist'],
        bloodBank: {'O+': 'Available (12 Units)', 'B+': 'Available'},
        lastUpdated: '4 min ago',
        isVerified: true,
        verificationStatus: 'aerva_verified',
        phone: '+91 33 6628 4444',
        lat: 22.5186,
        lng: 88.4042,
        address: '730, Anandapur, EM Bypass Road, Kolkata',
        primaryCapabilities: ['Trauma', 'Stroke', 'Cardiac', 'Breathing Emergency'],
        doctorInChargeName: 'Dr. Suparno Mitra',
        doctorInChargeRole: 'Critical Care Lead',
        doctorInChargeShift: 'Emergency Day Lead',
      ),
    ];

    // If live GPS or manual origin is provided, recompute precise dynamic distances & ETAs
    if (originLat != null && originLng != null) {
      final updatedList = rawList.map((h) {
        final dist = calculateDistanceKm(originLat, originLng, h.lat, h.lng);
        final roundedDist = (dist * 10).round() / 10.0;
        final eta = (roundedDist * 2.4).round().clamp(3, 120);
        return h.copyWith(distanceKm: roundedDist, etaMinutes: eta);
      }).toList();

      // Geofencing filter: 50 km boundary
      if (filterByGeofence) {
        final inFence = updatedList.where((h) => h.distanceKm <= geofenceRadiusKm).toList();
        if (inFence.isNotEmpty) {
          inFence.sort((a, b) => a.distanceKm.compareTo(b.distanceKm));
          return inFence;
        }
      }

      // Proximity sort
      updatedList.sort((a, b) => a.distanceKm.compareTo(b.distanceKm));
      return updatedList;
    }

    return rawList;
  }
}
