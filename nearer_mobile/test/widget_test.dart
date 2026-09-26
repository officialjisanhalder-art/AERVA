import 'package:flutter_test/flutter_test.dart';
import 'package:nearer_mobile/models/emergency_case.dart';
import 'package:nearer_mobile/services/i18n_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('EmergencyCase Ambulance Flow & Serialization Tests', () {
    test('Defaults to ambulanceRequired = true', () {
      final emergency = EmergencyCase(
        caseId: 'NR-1001',
        patientName: 'Rahul Verma',
        patientPhone: '+91 98765 43210',
        patientAge: '32',
        patientGender: 'Male',
        bloodGroup: 'B+',
        patientCount: 1,
        emergencyType: 'Trauma',
        writtenDescription: 'Fall from height',
        hasVoiceBrief: false,
        recordingDuration: 0,
        locationArea: 'Sector V',
        locationCity: 'Kolkata',
        originLat: 22.5800,
        originLng: 88.4200,
        hospitalId: 'h1',
        hospitalName: 'Apollo Hospital',
        hospitalPhone: '+91 33 2320 3040',
        hospitalLat: 22.5694,
        hospitalLng: 88.3986,
        hospitalAddress: '58 Canal Circular Road',
        etaMinutes: 8,
        distanceKm: 3.2,
        status: 'REQUEST_SENT',
        createdAt: DateTime.now(),
        messages: [],
      );

      expect(emergency.ambulanceRequired, isTrue);
      expect(emergency.ambulanceDispatched, isFalse);
    });

    test('Serializes and deserializes ambulanceRequired = false (Self-Transport)', () {
      final emergency = EmergencyCase(
        caseId: 'NR-1002',
        patientName: 'Ananya Sen',
        patientPhone: '+91 98311 00000',
        patientAge: '28',
        patientGender: 'Female',
        bloodGroup: 'O+',
        patientCount: 1,
        emergencyType: 'Cardiac',
        writtenDescription: 'Chest pain',
        hasVoiceBrief: false,
        recordingDuration: 0,
        locationArea: 'Salt Lake',
        locationCity: 'Kolkata',
        originLat: 22.5800,
        originLng: 88.4200,
        hospitalId: 'h2',
        hospitalName: 'AMRI Hospital',
        hospitalPhone: '+91 33 6606 3800',
        hospitalLat: 22.5645,
        hospitalLng: 88.4069,
        hospitalAddress: 'JC-16 & 17, Sector III',
        etaMinutes: 6,
        distanceKm: 2.1,
        status: 'REQUEST_SENT',
        createdAt: DateTime.now(),
        messages: [],
        ambulanceRequired: false,
        ambulanceDispatched: false,
      );

      expect(emergency.ambulanceRequired, isFalse);

      final map = emergency.toMap();
      expect(map['ambulanceRequired'], isFalse);
      expect(map['ambulanceDispatched'], isFalse);

      final restored = EmergencyCase.fromMap(map);
      expect(restored.ambulanceRequired, isFalse);
      expect(restored.ambulanceDispatched, isFalse);
      expect(restored.caseId, equals('NR-1002'));
    });

    test('Transitions from Self-Transport to Ambulance Required via copyWith', () {
      final initialCase = EmergencyCase(
        caseId: 'NR-1003',
        patientName: 'Debashis Roy',
        patientPhone: '+91 98300 11111',
        patientAge: '45',
        patientGender: 'Male',
        bloodGroup: 'A+',
        patientCount: 1,
        emergencyType: 'Stroke',
        writtenDescription: '',
        hasVoiceBrief: false,
        recordingDuration: 0,
        locationArea: 'New Town',
        locationCity: 'Kolkata',
        originLat: 22.5850,
        originLng: 88.4700,
        hospitalId: 'h1',
        hospitalName: 'Apollo Hospital',
        hospitalPhone: '+91 33 2320 3040',
        hospitalLat: 22.5694,
        hospitalLng: 88.3986,
        hospitalAddress: '58 Canal Circular Road',
        etaMinutes: 12,
        distanceKm: 5.4,
        status: 'REQUEST_SENT',
        createdAt: DateTime.now(),
        messages: [],
        ambulanceRequired: false,
        ambulanceDispatched: false,
      );

      final upgradedCase = initialCase.copyWith(
        ambulanceRequired: true,
        ambulanceDispatched: true,
      );

      expect(upgradedCase.ambulanceRequired, isTrue);
      expect(upgradedCase.ambulanceDispatched, isTrue);
      expect(upgradedCase.caseId, equals('NR-1003'));
    });

    test('I18n translations contain all ambulance keys for EN and HI', () {
      I18nService.currentLang.value = 'en';
      expect(I18nService.t('emergency.ambulanceRequired'), isNotEmpty);
      expect(I18nService.t('emergency.selfTransport'), isNotEmpty);
      expect(I18nService.t('emergency.needAmbulance'), isNotEmpty);

      I18nService.currentLang.value = 'hi';
      expect(I18nService.t('emergency.ambulanceRequired'), contains('आपातकालीन'));
      expect(I18nService.t('emergency.selfTransport'), contains('परिवहन'));
    });
  });
}
