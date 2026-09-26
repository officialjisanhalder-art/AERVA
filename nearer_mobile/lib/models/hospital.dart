class Hospital {
  final String id;
  final String name;
  final String type;
  final double distanceKm;
  final int etaMinutes;
  final int erAvailable;
  final int erTotal;
  final int icuAvailable;
  final int icuTotal;
  final List<String> specialists;
  final Map<String, String> bloodBank;
  final String lastUpdated;
  final bool isVerified;
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
    required this.erAvailable,
    required this.erTotal,
    required this.icuAvailable,
    required this.icuTotal,
    required this.specialists,
    required this.bloodBank,
    required this.lastUpdated,
    required this.isVerified,
    required this.phone,
    required this.lat,
    required this.lng,
    required this.address,
    required this.primaryCapabilities,
    this.doctorInChargeName = "Dr. Vikram Malhotra",
    this.doctorInChargeRole = "HOD Trauma Surgery",
    this.doctorInChargeShift = "Active On-Duty Shift",
  });

  Hospital withReservedBed() {
    return Hospital(
      id: id,
      name: name,
      type: type,
      distanceKm: distanceKm,
      etaMinutes: etaMinutes,
      erAvailable: (erAvailable - 1).clamp(0, erTotal),
      erTotal: erTotal,
      icuAvailable: icuAvailable,
      icuTotal: icuTotal,
      specialists: specialists,
      bloodBank: bloodBank,
      lastUpdated: 'Just now (Updated)',
      isVerified: isVerified,
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
  }) {
    return Hospital(
      id: id,
      name: name,
      type: type,
      distanceKm: distanceKm,
      etaMinutes: etaMinutes,
      erAvailable: erAvailable ?? this.erAvailable,
      erTotal: erTotal ?? this.erTotal,
      icuAvailable: icuAvailable ?? this.icuAvailable,
      icuTotal: icuTotal ?? this.icuTotal,
      specialists: specialists,
      bloodBank: bloodBank,
      lastUpdated: lastUpdated ?? this.lastUpdated,
      isVerified: isVerified,
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

  static List<Hospital> getHospitals() {
    return [
      Hospital(
        id: 'h1',
        name: 'Apollo Multispeciality Hospitals',
        type: 'Level 1 Trauma & Super Specialty Center',
        distanceKm: 2.5,
        etaMinutes: 7,
        erAvailable: 6,
        erTotal: 30,
        icuAvailable: 4,
        icuTotal: 18,
        specialists: ['Cardiologist', 'General Surgeon', 'Trauma Specialist'],
        bloodBank: {'O+': 'Available (6 Units)', 'O-': 'Available (2 Units)', 'A+': 'Available'},
        lastUpdated: '2 min ago',
        isVerified: true,
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
        id: 'h3',
        name: 'Columbia Asia Hospital (Manipal)',
        type: 'Cardiac & Neuro Specialty',
        distanceKm: 4.1,
        etaMinutes: 12,
        erAvailable: 12,
        erTotal: 25,
        icuAvailable: 6,
        icuTotal: 15,
        specialists: ['Trauma Surgeon', 'Burn Specialist', 'Orthopedic Surgeon'],
        bloodBank: {'O+': 'Available (8 Units)', 'AB+': 'Available', 'A-': 'Limited'},
        lastUpdated: '5 min ago',
        isVerified: true,
        phone: '+91 33 6607 0000',
        lat: 22.5683,
        lng: 88.4087,
        address: 'IB-193, Broadway Rd, Sector III, Salt Lake, Kolkata',
        primaryCapabilities: ['Cardiac', 'Stroke', 'Breathing Emergency'],
        doctorInChargeName: 'Dr. Ananya Mukherjee',
        doctorInChargeRole: 'HOD Emergency Services',
        doctorInChargeShift: 'Day Lead (07:00 - 19:00)',
      ),
      Hospital(
        id: 'h4',
        name: 'City General Hospital',
        type: 'Government Multi-Care Facility',
        distanceKm: 5.6,
        etaMinutes: 14,
        erAvailable: 1,
        erTotal: 25,
        icuAvailable: 0,
        icuTotal: 10,
        specialists: ['General Surgeon', 'Internal Medicine', 'Triage Physician'],
        bloodBank: {'O+': 'Available (14 Units)', 'B-': 'Depleted'},
        lastUpdated: '3m ago',
        isVerified: true,
        phone: '+91 98300 77888',
        lat: 22.5620,
        lng: 88.3980,
        address: 'Central Avenue, Kolkata',
        primaryCapabilities: ['Burns', 'Other', 'Trauma'],
        doctorInChargeName: 'Dr. Rajesh Gupta',
        doctorInChargeRole: 'Emergency Registrar & Triage Head',
        doctorInChargeShift: 'General Casualty Shift',
      ),
    ];
  }
}
