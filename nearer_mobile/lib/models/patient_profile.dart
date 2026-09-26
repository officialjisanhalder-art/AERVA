class AllergyItem {
  final String id;
  final String name;
  final String category;
  final String severity;

  AllergyItem({
    required this.id,
    required this.name,
    required this.category,
    required this.severity,
  });

  Map<String, dynamic> toMap() => {
    'id': id,
    'name': name,
    'category': category,
    'severity': severity,
  };

  factory AllergyItem.fromMap(Map<String, dynamic> map) => AllergyItem(
    id: map['id'] ?? '',
    name: map['name'] ?? '',
    category: map['category'] ?? 'Drug',
    severity: map['severity'] ?? 'Moderate',
  );
}

class MedicationItem {
  final String id;
  final String name;
  final String dosage;
  final String frequency;
  final String prescribedFor;

  MedicationItem({
    required this.id,
    required this.name,
    required this.dosage,
    required this.frequency,
    required this.prescribedFor,
  });

  Map<String, dynamic> toMap() => {
    'id': id,
    'name': name,
    'dosage': dosage,
    'frequency': frequency,
    'prescribedFor': prescribedFor,
  };

  factory MedicationItem.fromMap(Map<String, dynamic> map) => MedicationItem(
    id: map['id'] ?? '',
    name: map['name'] ?? '',
    dosage: map['dosage'] ?? '',
    frequency: map['frequency'] ?? '',
    prescribedFor: map['prescribedFor'] ?? '',
  );
}

class PatientProfile {
  final String healthId;
  final String fullName;
  final String phone;
  final String email;
  final String dateOfBirth;
  final String age;
  final String gender;
  final String bloodGroup;
  final String address;
  final String emergencyContactName;
  final String emergencyContactRelation;
  final String emergencyContactPhone;
  final List<AllergyItem> allergies;
  final List<String> chronicConditions;
  final List<MedicationItem> medications;
  final bool organDonor;
  final bool autoShareInEmergency;

  PatientProfile({
    required this.healthId,
    required this.fullName,
    required this.phone,
    required this.email,
    required this.dateOfBirth,
    required this.age,
    required this.gender,
    required this.bloodGroup,
    required this.address,
    required this.emergencyContactName,
    required this.emergencyContactRelation,
    required this.emergencyContactPhone,
    required this.allergies,
    required this.chronicConditions,
    required this.medications,
    this.organDonor = true,
    this.autoShareInEmergency = true,
  });

  PatientProfile copyWith({
    String? healthId,
    String? fullName,
    String? phone,
    String? email,
    String? dateOfBirth,
    String? age,
    String? gender,
    String? bloodGroup,
    String? address,
    String? emergencyContactName,
    String? emergencyContactRelation,
    String? emergencyContactPhone,
    List<AllergyItem>? allergies,
    List<String>? chronicConditions,
    List<MedicationItem>? medications,
    bool? organDonor,
    bool? autoShareInEmergency,
  }) {
    return PatientProfile(
      healthId: healthId ?? this.healthId,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      age: age ?? this.age,
      gender: gender ?? this.gender,
      bloodGroup: bloodGroup ?? this.bloodGroup,
      address: address ?? this.address,
      emergencyContactName: emergencyContactName ?? this.emergencyContactName,
      emergencyContactRelation: emergencyContactRelation ?? this.emergencyContactRelation,
      emergencyContactPhone: emergencyContactPhone ?? this.emergencyContactPhone,
      allergies: allergies ?? this.allergies,
      chronicConditions: chronicConditions ?? this.chronicConditions,
      medications: medications ?? this.medications,
      organDonor: organDonor ?? this.organDonor,
      autoShareInEmergency: autoShareInEmergency ?? this.autoShareInEmergency,
    );
  }

  Map<String, dynamic> toMap() => {
    'healthId': healthId,
    'fullName': fullName,
    'phone': phone,
    'email': email,
    'dateOfBirth': dateOfBirth,
    'age': age,
    'gender': gender,
    'bloodGroup': bloodGroup,
    'address': address,
    'emergencyContactName': emergencyContactName,
    'emergencyContactRelation': emergencyContactRelation,
    'emergencyContactPhone': emergencyContactPhone,
    'allergies': allergies.map((a) => a.toMap()).toList(),
    'chronicConditions': chronicConditions,
    'medications': medications.map((m) => m.toMap()).toList(),
    'organDonor': organDonor,
    'autoShareInEmergency': autoShareInEmergency,
  };

  Map<String, dynamic> toQrPayload() => {
    'app': 'NearER_Passport',
    'hid': healthId,
    'name': fullName,
    'bg': bloodGroup,
    'age': age,
    'gender': gender,
    'kin': '$emergencyContactName ($emergencyContactPhone)',
    'allergies': allergies.map((a) => '${a.name} [${a.severity}]').toList(),
    'conditions': chronicConditions,
    'meds': medications.map((m) => '${m.name} ${m.dosage}').toList(),
    'donor': organDonor,
  };

  factory PatientProfile.fromMap(Map<String, dynamic> map) => PatientProfile(
    healthId: map['healthId'] ?? 'HID-9842-108',
    fullName: map['fullName'] ?? 'Jisan Halder',
    phone: map['phone'] ?? '+91 98765 43210',
    email: map['email'] ?? 'jisan.halder@example.com',
    dateOfBirth: map['dateOfBirth'] ?? '1998-04-12',
    age: map['age'] ?? '28',
    gender: map['gender'] ?? 'Male',
    bloodGroup: map['bloodGroup'] ?? 'O+',
    address: map['address'] ?? 'Block AE, Sector 1, Salt Lake, Kolkata',
    emergencyContactName: map['emergencyContactName'] ?? 'Subhash Halder',
    emergencyContactRelation: map['emergencyContactRelation'] ?? 'Brother',
    emergencyContactPhone: map['emergencyContactPhone'] ?? '+91 98301 23456',
    allergies: (map['allergies'] as List<dynamic>? ?? [])
        .map((a) => AllergyItem.fromMap(Map<String, dynamic>.from(a)))
        .toList(),
    chronicConditions: List<String>.from(map['chronicConditions'] ?? []),
    medications: (map['medications'] as List<dynamic>? ?? [])
        .map((m) => MedicationItem.fromMap(Map<String, dynamic>.from(m)))
        .toList(),
    organDonor: map['organDonor'] ?? true,
    autoShareInEmergency: map['autoShareInEmergency'] ?? true,
  );

  static PatientProfile defaultProfile() => PatientProfile(
    healthId: 'HID-9842-108',
    fullName: 'Jisan Halder',
    phone: '+91 98765 43210',
    email: 'jisan.halder@example.com',
    dateOfBirth: '1998-04-12',
    age: '28',
    gender: 'Male',
    bloodGroup: 'O+',
    address: 'Block AE, Sector 1, Salt Lake, Kolkata',
    emergencyContactName: 'Subhash Halder',
    emergencyContactRelation: 'Brother',
    emergencyContactPhone: '+91 98301 23456',
    allergies: [
      AllergyItem(id: 'a1', name: 'Penicillin (Antibiotics)', category: 'Drug', severity: 'Severe / Anaphylaxis'),
      AllergyItem(id: 'a2', name: 'Sulfa Drugs', category: 'Drug', severity: 'Moderate'),
      AllergyItem(id: 'a3', name: 'Peanuts', category: 'Food', severity: 'Mild'),
    ],
    chronicConditions: ['Mild Bronchial Asthma', 'Seasonal Rhinitis'],
    medications: [
      MedicationItem(id: 'm1', name: 'Montelukast', dosage: '10mg', frequency: 'Daily at night', prescribedFor: 'Asthma'),
      MedicationItem(id: 'm2', name: 'Levocetirizine', dosage: '5mg', frequency: 'As needed', prescribedFor: 'Allergies'),
    ],
    organDonor: true,
    autoShareInEmergency: true,
  );
}
