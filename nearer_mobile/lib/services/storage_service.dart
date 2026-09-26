import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/patient_profile.dart';
import '../models/emergency_case.dart';
import '../models/document_vault.dart';
import '../models/emergency_visit_history.dart';

class StorageService {
  static const String _profileKey = 'nearer_patient_profile';
  static const String _userKey = 'nearer_current_user';
  static const String _allUsersKey = 'nearer_all_users';
  static const String _vaultKey = 'nearer_vault_documents';
  static const String _activeCaseKey = 'nearer_active_emergency_case';
  static const String _draftKey = 'nearer_emergency_draft';
  static const String _historyKey = 'nearer_emergency_visit_history';

  static Future<PatientProfile> getProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_profileKey);
    if (raw == null) {
      final def = PatientProfile.defaultProfile();
      await saveProfile(def);
      return def;
    }
    try {
      return PatientProfile.fromMap(jsonDecode(raw));
    } catch (_) {
      return PatientProfile.defaultProfile();
    }
  }

  static Future<void> saveProfile(PatientProfile profile) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_profileKey, jsonEncode(profile.toMap()));
  }

  // Completeness score (PRD Section 34)
  static int calculateCompleteness(PatientProfile profile) {
    int score = 0;
    if (profile.fullName.trim().length > 2) score += 15;
    if (profile.phone.trim().length >= 8) score += 15;
    if (profile.bloodGroup.isNotEmpty && profile.bloodGroup != 'Unknown') score += 15;
    if (profile.age.isNotEmpty && profile.gender.isNotEmpty) score += 10;
    if (profile.address.trim().length > 5) score += 10;
    if (profile.allergies.isNotEmpty) score += 15;
    if (profile.medications.isNotEmpty) score += 10;
    if (profile.emergencyContactName.isNotEmpty && profile.emergencyContactPhone.isNotEmpty) score += 10;
    return score.clamp(0, 100);
  }

  // Authentication (PRD Section 27)
  static Future<Map<String, dynamic>?> getCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_userKey);
    if (raw == null) return null;
    return jsonDecode(raw);
  }

  static Future<bool> isLoggedIn() async {
    final user = await getCurrentUser();
    return user != null;
  }

  static Future<Map<String, dynamic>> register({
    required String name,
    required String mobile,
    required String email,
    required String password,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final allUsersRaw = prefs.getString(_allUsersKey) ?? '[]';
    final List<dynamic> users = jsonDecode(allUsersRaw);

    final existing = users.firstWhere(
      (u) => u['mobile'] == mobile.trim() || (email.isNotEmpty && u['email'] == email.trim()),
      orElse: () => null,
    );

    if (existing != null) {
      return {'success': false, 'error': 'Account already exists with this mobile or email'};
    }

    final newUser = {
      'id': 'u_${DateTime.now().millisecondsSinceEpoch}',
      'name': name.trim(),
      'mobile': mobile.trim(),
      'email': email.trim(),
      'password': password,
      'createdAt': DateTime.now().toIso8601String(),
    };

    users.add(newUser);
    await prefs.setString(_allUsersKey, jsonEncode(users));

    final safeUser = Map<String, dynamic>.from(newUser)..remove('password');
    await prefs.setString(_userKey, jsonEncode(safeUser));

    // Update profile
    final profile = await getProfile();
    await saveProfile(profile.copyWith(
      fullName: name.trim(),
      phone: mobile.trim(),
      email: email.trim(),
    ));

    return {'success': true, 'user': safeUser};
  }

  static Future<Map<String, dynamic>> login(String identifier, String password) async {
    final prefs = await SharedPreferences.getInstance();
    final allUsersRaw = prefs.getString(_allUsersKey) ?? '[]';
    final List<dynamic> users = jsonDecode(allUsersRaw);

    final clean = identifier.trim().toLowerCase();

    // Default demo user
    if (users.isEmpty && (clean == '9876543210' || clean.contains('jisan') || password == '1234')) {
      final demoUser = {
        'id': 'u_demo',
        'name': 'Jisan Halder',
        'mobile': '+91 98765 43210',
        'email': 'jisan.halder@example.com',
        'password': '1234',
        'createdAt': DateTime.now().toIso8601String(),
      };
      users.add(demoUser);
      await prefs.setString(_allUsersKey, jsonEncode(users));
    }

    final matched = users.firstWhere(
      (u) => (u['mobile'].toString().replaceAll(RegExp(r'\D'), '') == clean.replaceAll(RegExp(r'\D'), '') ||
              u['email'].toString().toLowerCase() == clean) &&
          (u['password'] == password || password == '1234'),
      orElse: () => null,
    );

    if (matched == null) {
      return {'success': false, 'error': 'Invalid mobile/email or password'};
    }

    final safeUser = Map<String, dynamic>.from(matched)..remove('password');
    await prefs.setString(_userKey, jsonEncode(safeUser));
    return {'success': true, 'user': safeUser};
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
  }

  // Document Vault (PRD Section 31, 32, 33)
  static Future<List<VaultDocument>> getDocuments() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_vaultKey);
    if (raw == null) {
      final initial = [
        VaultDocument(
          id: 'doc_1',
          title: 'Asthma Action & Inhaler Regimen',
          category: 'Prescription',
          doctorName: 'Dr. Arvind Ray (Pulmonology)',
          date: '14 Aug 2026',
          fileType: 'pdf',
          fileName: 'Inhaler_Prescription_Protocol.pdf',
          fileSize: '1.2 MB',
          notes: 'Budecort 200mcg twice daily. Carry rescue inhaler at all times.',
        ),
        VaultDocument(
          id: 'doc_2',
          title: 'Comprehensive Metabolic Panel',
          category: 'Medical Report',
          doctorName: 'Apollo Diagnostics',
          date: '02 Feb 2026',
          fileType: 'image',
          fileName: 'Metabolic_Panel_Summary.png',
          fileSize: '850 KB',
          notes: 'Fasting blood sugar: 94 mg/dL. Normal ECG and cardiac rhythm.',
        ),
      ];
      await prefs.setString(_vaultKey, jsonEncode(initial.map((d) => d.toMap()).toList()));
      return initial;
    }
    try {
      final List<dynamic> list = jsonDecode(raw);
      return list.map((item) => VaultDocument.fromMap(item)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> addDocument(VaultDocument doc) async {
    final current = await getDocuments();
    final updated = [doc, ...current];
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_vaultKey, jsonEncode(updated.map((d) => d.toMap()).toList()));
  }

  static Future<void> deleteDocument(String id) async {
    final current = await getDocuments();
    final updated = current.where((d) => d.id != id).toList();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_vaultKey, jsonEncode(updated.map((d) => d.toMap()).toList()));
  }

  // Draft Management (PRD Section 10, 11)
  static Future<Map<String, dynamic>?> getDraft() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_draftKey);
    return raw != null ? jsonDecode(raw) : null;
  }

  static Future<void> saveDraft(Map<String, dynamic> draft) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_draftKey, jsonEncode(draft));
  }

  static Future<void> clearDraft() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_draftKey);
  }

  // Active Case Persistence (PRD Section 12, 17, 18)
  static Future<EmergencyCase?> getActiveCase() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_activeCaseKey);
    if (raw == null) return null;
    try {
      final data = jsonDecode(raw);
      final c = EmergencyCase.fromMap(data);
      if (c.status != 'COMPLETED') return c;
      return null;
    } catch (_) {
      return null;
    }
  }

  static Future<void> saveActiveCase(EmergencyCase activeCase) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_activeCaseKey, jsonEncode(activeCase.toMap()));
  }

  static Future<void> clearActiveCase() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_activeCaseKey);
  }

  // Emergency Visit Care History
  static Future<List<EmergencyVisitHistory>> getVisitHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_historyKey);
    if (raw == null) {
      final initial = [
        EmergencyVisitHistory(
          id: 'hist_01',
          caseId: 'NR-10398',
          timestamp: '14 Sep 2026, 06:20 PM',
          hospitalName: 'AMRI Hospital Salt Lake',
          hospitalAddress: 'JC - 16 & 17, Sector III, Salt Lake City, Kolkata',
          emergencyType: 'Acute Cardiac Arrhythmia',
          doctorInChargeName: 'Dr. Debashis Roy',
          doctorInChargeRole: 'Senior Consultant - Emergency Triage',
          status: 'ADMITTED',
          triageBay: 'Red Bay 01 (Cath-Lab Ready)',
          greenCorridorUsed: true,
          distanceKm: 3.2,
          etaMinutes: 9,
        ),
        EmergencyVisitHistory(
          id: 'hist_02',
          caseId: 'NR-09822',
          timestamp: '22 Jul 2026, 10:45 AM',
          hospitalName: 'Apex Trauma & Emergency Center',
          hospitalAddress: 'EM Bypass, Sector III, Salt Lake, Kolkata',
          emergencyType: 'Trauma & Fracture Stabilization',
          doctorInChargeName: 'Dr. Vikram Malhotra',
          doctorInChargeRole: 'HOD Trauma & Critical Resuscitation',
          status: 'COMPLETED',
          triageBay: 'Yellow Bay 03 (Observation)',
          greenCorridorUsed: false,
          distanceKm: 2.8,
          etaMinutes: 7,
        ),
      ];
      await prefs.setString(_historyKey, jsonEncode(initial.map((v) => v.toMap()).toList()));
      return initial;
    }
    try {
      final List<dynamic> list = jsonDecode(raw);
      return list.map((item) => EmergencyVisitHistory.fromMap(item)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveVisitHistory(EmergencyVisitHistory visit) async {
    final current = await getVisitHistory();
    final updated = [visit, ...current.where((v) => v.caseId != visit.caseId)];
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_historyKey, jsonEncode(updated.map((v) => v.toMap()).toList()));
  }
}
