class EmergencyMessage {
  final String id;
  final String sender; // 'patient' or 'hospital'
  final String text;
  final String time;
  final bool isVoice;
  final String? audioPath;

  EmergencyMessage({
    required this.id,
    required this.sender,
    required this.text,
    required this.time,
    this.isVoice = false,
    this.audioPath,
  });

  Map<String, dynamic> toMap() => {
    'id': id,
    'sender': sender,
    'text': text,
    'time': time,
    'isVoice': isVoice,
    'audioPath': audioPath,
  };

  factory EmergencyMessage.fromMap(Map<String, dynamic> map) => EmergencyMessage(
    id: map['id'] ?? '',
    sender: map['sender'] ?? 'patient',
    text: map['text'] ?? '',
    time: map['time'] ?? '',
    isVoice: map['isVoice'] ?? false,
    audioPath: map['audioPath'],
  );
}

class EmergencyCase {
  final String caseId;
  final String patientName;
  final String patientPhone;
  final String patientAge;
  final String patientGender;
  final String bloodGroup;
  final int patientCount;
  final String emergencyType;
  final String writtenDescription;
  final bool hasVoiceBrief;
  final String? voiceFilePath;
  final int recordingDuration;
  final String locationArea;
  final String locationCity;
  final double originLat;
  final double originLng;
  final String hospitalId;
  final String hospitalName;
  final String hospitalPhone;
  final double hospitalLat;
  final double hospitalLng;
  final String hospitalAddress;
  final int etaMinutes;
  final double distanceKm;
  final String status;
  final DateTime createdAt;
  final List<EmergencyMessage> messages;
  final String doctorInChargeName;
  final String doctorInChargeRole;
  final bool greenCorridorAlerted;
  final int erBedsAvailable;
  final String assignedBedBay;
  final bool ambulanceRequired;
  final bool ambulanceDispatched;

  EmergencyCase({
    required this.caseId,
    required this.patientName,
    required this.patientPhone,
    required this.patientAge,
    required this.patientGender,
    required this.bloodGroup,
    required this.patientCount,
    required this.emergencyType,
    required this.writtenDescription,
    required this.hasVoiceBrief,
    this.voiceFilePath,
    required this.recordingDuration,
    required this.locationArea,
    required this.locationCity,
    required this.originLat,
    required this.originLng,
    required this.hospitalId,
    required this.hospitalName,
    required this.hospitalPhone,
    required this.hospitalLat,
    required this.hospitalLng,
    required this.hospitalAddress,
    required this.etaMinutes,
    required this.distanceKm,
    required this.status,
    required this.createdAt,
    required this.messages,
    this.doctorInChargeName = "Dr. Vikram Malhotra",
    this.doctorInChargeRole = "HOD Trauma Surgery (On-Duty)",
    this.greenCorridorAlerted = false,
    this.erBedsAvailable = 3,
    this.assignedBedBay = "Red Bay 01 (Immediate Critical Care)",
    this.ambulanceRequired = true,
    this.ambulanceDispatched = false,
  });

  EmergencyCase copyWith({
    String? status,
    List<EmergencyMessage>? messages,
    bool? greenCorridorAlerted,
    int? erBedsAvailable,
    String? doctorInChargeName,
    String? doctorInChargeRole,
    String? assignedBedBay,
    bool? ambulanceRequired,
    bool? ambulanceDispatched,
  }) {
    return EmergencyCase(
      caseId: caseId,
      patientName: patientName,
      patientPhone: patientPhone,
      patientAge: patientAge,
      patientGender: patientGender,
      bloodGroup: bloodGroup,
      patientCount: patientCount,
      emergencyType: emergencyType,
      writtenDescription: writtenDescription,
      hasVoiceBrief: hasVoiceBrief,
      voiceFilePath: voiceFilePath,
      recordingDuration: recordingDuration,
      locationArea: locationArea,
      locationCity: locationCity,
      originLat: originLat,
      originLng: originLng,
      hospitalId: hospitalId,
      hospitalName: hospitalName,
      hospitalPhone: hospitalPhone,
      hospitalLat: hospitalLat,
      hospitalLng: hospitalLng,
      hospitalAddress: hospitalAddress,
      etaMinutes: etaMinutes,
      distanceKm: distanceKm,
      status: status ?? this.status,
      createdAt: createdAt,
      messages: messages ?? this.messages,
      doctorInChargeName: doctorInChargeName ?? this.doctorInChargeName,
      doctorInChargeRole: doctorInChargeRole ?? this.doctorInChargeRole,
      greenCorridorAlerted: greenCorridorAlerted ?? this.greenCorridorAlerted,
      erBedsAvailable: erBedsAvailable ?? this.erBedsAvailable,
      assignedBedBay: assignedBedBay ?? this.assignedBedBay,
      ambulanceRequired: ambulanceRequired ?? this.ambulanceRequired,
      ambulanceDispatched: ambulanceDispatched ?? this.ambulanceDispatched,
    );
  }

  Map<String, dynamic> toMap() => {
    'caseId': caseId,
    'patientName': patientName,
    'patientPhone': patientPhone,
    'patientAge': patientAge,
    'patientGender': patientGender,
    'bloodGroup': bloodGroup,
    'patientCount': patientCount,
    'emergencyType': emergencyType,
    'writtenDescription': writtenDescription,
    'hasVoiceBrief': hasVoiceBrief,
    'voiceFilePath': voiceFilePath,
    'recordingDuration': recordingDuration,
    'locationArea': locationArea,
    'locationCity': locationCity,
    'originLat': originLat,
    'originLng': originLng,
    'hospitalId': hospitalId,
    'hospitalName': hospitalName,
    'hospitalPhone': hospitalPhone,
    'hospitalLat': hospitalLat,
    'hospitalLng': hospitalLng,
    'hospitalAddress': hospitalAddress,
    'etaMinutes': etaMinutes,
    'distanceKm': distanceKm,
    'status': status,
    'createdAt': createdAt.toIso8601String(),
    'messages': messages.map((m) => m.toMap()).toList(),
    'doctorInChargeName': doctorInChargeName,
    'doctorInChargeRole': doctorInChargeRole,
    'greenCorridorAlerted': greenCorridorAlerted,
    'erBedsAvailable': erBedsAvailable,
    'assignedBedBay': assignedBedBay,
    'ambulanceRequired': ambulanceRequired,
    'ambulanceDispatched': ambulanceDispatched,
  };

  factory EmergencyCase.fromMap(Map<String, dynamic> map) => EmergencyCase(
    caseId: map['caseId'] ?? '',
    patientName: map['patientName'] ?? '',
    patientPhone: map['patientPhone'] ?? '',
    patientAge: map['patientAge'] ?? '28',
    patientGender: map['patientGender'] ?? 'Male',
    bloodGroup: map['bloodGroup'] ?? 'O+',
    patientCount: map['patientCount'] ?? 1,
    emergencyType: map['emergencyType'] ?? 'Cardiac',
    writtenDescription: map['writtenDescription'] ?? '',
    hasVoiceBrief: map['hasVoiceBrief'] ?? false,
    voiceFilePath: map['voiceFilePath'],
    recordingDuration: map['recordingDuration'] ?? 0,
    locationArea: map['locationArea'] ?? 'Salt Lake',
    locationCity: map['locationCity'] ?? 'Kolkata',
    originLat: (map['originLat'] as num?)?.toDouble() ?? 22.5800,
    originLng: (map['originLng'] as num?)?.toDouble() ?? 88.4200,
    hospitalId: map['hospitalId'] ?? '',
    hospitalName: map['hospitalName'] ?? '',
    hospitalPhone: map['hospitalPhone'] ?? '',
    hospitalLat: (map['hospitalLat'] as num?)?.toDouble() ?? 22.5830,
    hospitalLng: (map['hospitalLng'] as num?)?.toDouble() ?? 88.4230,
    hospitalAddress: map['hospitalAddress'] ?? '',
    etaMinutes: map['etaMinutes'] ?? 8,
    distanceKm: (map['distanceKm'] as num?)?.toDouble() ?? 3.2,
    status: map['status'] ?? 'REQUEST_SENT',
    createdAt: DateTime.tryParse(map['createdAt'] ?? '') ?? DateTime.now(),
    messages: (map['messages'] as List<dynamic>? ?? [])
        .map((m) => EmergencyMessage.fromMap(Map<String, dynamic>.from(m)))
        .toList(),
    doctorInChargeName: map['doctorInChargeName'] ?? 'Dr. Vikram Malhotra',
    doctorInChargeRole: map['doctorInChargeRole'] ?? 'HOD Trauma Surgery (On-Duty)',
    greenCorridorAlerted: map['greenCorridorAlerted'] ?? false,
    erBedsAvailable: map['erBedsAvailable'] ?? 3,
    assignedBedBay: map['assignedBedBay'] ?? 'Red Bay 01 (Immediate Critical Care)',
    ambulanceRequired: map['ambulanceRequired'] ?? true,
    ambulanceDispatched: map['ambulanceDispatched'] ?? false,
  );
}
