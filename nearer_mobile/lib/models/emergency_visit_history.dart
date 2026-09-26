class EmergencyVisitHistory {
  final String id;
  final String caseId;
  final String timestamp;
  final String hospitalName;
  final String hospitalAddress;
  final String emergencyType;
  final String doctorInChargeName;
  final String doctorInChargeRole;
  final String status;
  final String triageBay;
  final bool greenCorridorUsed;
  final double distanceKm;
  final int etaMinutes;

  EmergencyVisitHistory({
    required this.id,
    required this.caseId,
    required this.timestamp,
    required this.hospitalName,
    required this.hospitalAddress,
    required this.emergencyType,
    required this.doctorInChargeName,
    required this.doctorInChargeRole,
    required this.status,
    required this.triageBay,
    required this.greenCorridorUsed,
    required this.distanceKm,
    required this.etaMinutes,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'caseId': caseId,
      'timestamp': timestamp,
      'hospitalName': hospitalName,
      'hospitalAddress': hospitalAddress,
      'emergencyType': emergencyType,
      'doctorInChargeName': doctorInChargeName,
      'doctorInChargeRole': doctorInChargeRole,
      'status': status,
      'triageBay': triageBay,
      'greenCorridorUsed': greenCorridorUsed,
      'distanceKm': distanceKm,
      'etaMinutes': etaMinutes,
    };
  }

  factory EmergencyVisitHistory.fromMap(Map<String, dynamic> map) {
    return EmergencyVisitHistory(
      id: map['id'] ?? '',
      caseId: map['caseId'] ?? '',
      timestamp: map['timestamp'] ?? '',
      hospitalName: map['hospitalName'] ?? '',
      hospitalAddress: map['hospitalAddress'] ?? '',
      emergencyType: map['emergencyType'] ?? '',
      doctorInChargeName: map['doctorInChargeName'] ?? '',
      doctorInChargeRole: map['doctorInChargeRole'] ?? '',
      status: map['status'] ?? 'ADMITTED',
      triageBay: map['triageBay'] ?? 'Red Bay (Critical Resuscitation)',
      greenCorridorUsed: map['greenCorridorUsed'] ?? false,
      distanceKm: (map['distanceKm'] as num?)?.toDouble() ?? 0.0,
      etaMinutes: map['etaMinutes'] ?? 0,
    );
  }
}