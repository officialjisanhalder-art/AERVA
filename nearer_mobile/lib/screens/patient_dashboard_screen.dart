import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/app_theme.dart';
import '../models/patient_profile.dart';
import '../models/document_vault.dart';
import '../models/emergency_case.dart';
import '../services/storage_service.dart';
import '../services/i18n_service.dart';
import '../services/navigation_service.dart';
import '../models/emergency_visit_history.dart';
import 'emergency/location_capture_screen.dart';
import 'emergency/emergency_status_screen.dart';

class PatientDashboardScreen extends StatefulWidget {
  final int initialTab;
  const PatientDashboardScreen({super.key, this.initialTab = 0});

  @override
  State<PatientDashboardScreen> createState() => _PatientDashboardScreenState();
}

class _PatientDashboardScreenState extends State<PatientDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  PatientProfile _profile = PatientProfile.defaultProfile();
  List<VaultDocument> _documents = [];
  List<EmergencyVisitHistory> _visitHistory = [];
  EmergencyCase? _activeCase;
  bool _isLoading = true;
  int _completeness = 85;

  final List<String> _commonAllergens = [
    "Penicillin",
    "Sulfa Drugs",
    "Peanuts",
    "Latex",
    "Aspirin",
    "Iodine Contrast",
  ];

  final List<String> _commonConditions = [
    "Mild Bronchial Asthma",
    "Hypertension",
    "Type 2 Diabetes",
    "Seasonal Rhinitis",
    "Cardiac History",
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 5,
      vsync: this,
      initialIndex: widget.initialTab.clamp(0, 4),
    );
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final profile = await StorageService.getProfile();
    final docs = await StorageService.getDocuments();
    final visits = await StorageService.getVisitHistory();
    final activeCase = await StorageService.getActiveCase();
    final comp = StorageService.calculateCompleteness(profile);

    if (mounted) {
      setState(() {
        _profile = profile;
        _documents = docs;
        _visitHistory = visits;
        _activeCase = activeCase;
        _completeness = comp;
        _isLoading = false;
      });
    }
  }

  Future<void> _saveProfile(PatientProfile updated) async {
    await StorageService.saveProfile(updated);
    final comp = StorageService.calculateCompleteness(updated);
    setState(() {
      _profile = updated;
      _completeness = comp;
    });
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("✓ ${I18nService.t('patient.saveChanges')}"),
          backgroundColor: const Color(0xFF059669),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  void _showQrPassportModal() {
    final qrPayload = jsonEncode(_profile.toQrPayload());

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        I18nService.t('patient.qrModalTitle').toUpperCase(),
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.primary,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Scannable QR Code
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0), width: 2),
                  ),
                  child: QrImageView(
                    data: qrPayload,
                    version: QrVersions.auto,
                    size: 200.0,
                    eyeStyle: const QrEyeStyle(
                      eyeShape: QrEyeShape.square,
                      color: Color(0xFF050B18),
                    ),
                    dataModuleStyle: const QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: Color(0xFF050B18),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                Text(
                  _profile.fullName,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF050B18)),
                ),
                Text(
                  "${_profile.healthId} • Blood: ${_profile.bloodGroup} • ${_profile.age} Yrs",
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primary),
                ),
                const SizedBox(height: 8),

                Text(
                  I18nService.t('patient.qrModalSubtitle'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 14),

                // Summary details
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      _qrRow("Critical Allergies", "${_profile.allergies.length} Flagged", isAlert: _profile.allergies.isNotEmpty),
                      const Divider(height: 10),
                      _qrRow("Active Medications", "${_profile.medications.length} Prescribed"),
                      const Divider(height: 10),
                      _qrRow("Kin Phone", _profile.emergencyContactPhone),
                      const Divider(height: 10),
                      _qrRow("Organ Donor", _profile.organDonor ? "Yes (Pledged)" : "No"),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.download, size: 16),
                        label: Text(I18nService.t('patient.saveLockscreen')),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        onPressed: () {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text("✓ Medical Passport saved for lockscreen emergency access"),
                              backgroundColor: Color(0xFF059669),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _qrRow(String label, String value, {bool isAlert = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: isAlert ? AppTheme.primary : const Color(0xFF050B18),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _callKin() async {
    final cleanPhone = _profile.emergencyContactPhone.replaceAll(RegExp(r'\s+'), '');
    final uri = Uri.parse("tel:$cleanPhone");
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Dialing: ${_profile.emergencyContactPhone}")),
        );
      }
    }
  }

  Future<void> _pickAndUploadDocument() async {
    final titleCtrl = TextEditingController();
    final doctorCtrl = TextEditingController();
    String category = "Prescription";

    final picked = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
    );

    if (picked.isEmpty) return;
    final file = picked.first;
    final fileSize = await file.xFile.length();

    if (fileSize > 10 * 1024 * 1024) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("File size exceeds 10MB limit. Please choose a smaller file."),
            backgroundColor: Color(0xFF0A2540),
          ),
        );
      }
      return;
    }

    if (!mounted) return;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text("Attach Medical Document", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(file.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.primary)),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: category,
                decoration: const InputDecoration(labelText: "Category"),
                items: ["Prescription", "Medical Report", "Discharge Summary", "Vaccine Record", "Other"]
                    .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                    .toList(),
                onChanged: (val) => setDState(() => category = val ?? "Prescription"),
              ),
              const SizedBox(height: 10),
              TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: "Record Title")),
              const SizedBox(height: 10),
              TextField(controller: doctorCtrl, decoration: const InputDecoration(labelText: "Doctor / Lab Name")),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel")),
            ElevatedButton(
              onPressed: () async {
                final newDoc = VaultDocument(
                  id: "doc_${DateTime.now().millisecondsSinceEpoch}",
                  title: titleCtrl.text.trim().isNotEmpty ? titleCtrl.text.trim() : file.name,
                  category: category,
                  doctorName: doctorCtrl.text.trim().isNotEmpty ? doctorCtrl.text.trim() : "Treating Specialist",
                  date: "${DateTime.now().day} ${_month(DateTime.now().month)} ${DateTime.now().year}",
                  fileType: file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "image",
                  fileName: file.name,
                  fileSize: "${(fileSize / 1024).round()} KB",
                  localPath: file.xFile.path,
                  notes: "Stored in NearER Digital Vault.",
                );
                await StorageService.addDocument(newDoc);
                Navigator.pop(ctx);
                _loadData();
              },
              child: const Text("Save"),
            ),
          ],
        ),
      ),
    );
  }

  String _month(int m) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[m - 1];
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppTheme.primary)));
    }

    return ValueListenableBuilder<String>(
      valueListenable: I18nService.currentLang,
      builder: (context, lang, _) {
        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            title: Text(I18nService.t('patient.title')),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, size: 18),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              // Language Switcher Button
              TextButton(
                onPressed: () {
                  I18nService.toggleLanguage();
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEEF3FF),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
                  ),
                  child: Text(
                    I18nService.t('lang.toggle'),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.primary,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
            ],
          ),
          body: SafeArea(
            child: Column(
              children: [
                // Active Emergency Banner (if an emergency is live)
                if (_activeCase != null)
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF1F2),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFFECDD3), width: 1.5),
                    ),
                    child: InkWell(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => EmergencyStatusScreen(emergencyCase: _activeCase!),
                          ),
                        );
                      },
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              color: AppTheme.primary,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.emergency, color: Colors.white, size: 18),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      I18nService.t('patient.activeEmergency'),
                                      style: const TextStyle(
                                        color: AppTheme.primary,
                                        fontWeight: FontWeight.w900,
                                        fontSize: 11,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      "• ${_activeCase!.caseId}",
                                      style: const TextStyle(fontSize: 10, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                                Text(
                                  "${_activeCase!.hospitalName} (${_activeCase!.doctorInChargeName})",
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                    color: Color(0xFF0F172A),
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.primary),
                        ],
                      ),
                    ),
                  ),

                // Top Digital Health ID Card with Scannable QR Button
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.primary, Color(0xFF003ECC), Color(0xFF0A2540)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primary.withOpacity(0.25),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Flexible(
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Flexible(
                                  child: Text(
                                    I18nService.t('patient.healthId'),
                                    style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (_profile.organDonor) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF059669).withOpacity(0.3),
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(color: const Color(0xFF34D399).withOpacity(0.4)),
                                    ),
                                    child: const Text("DONOR", style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFF059669),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(I18nService.t('patient.verified'), style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _profile.fullName,
                                  style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900),
                                  overflow: TextOverflow.ellipsis,
                                  maxLines: 1,
                                ),
                                Text(
                                  _profile.healthId,
                                  style: const TextStyle(color: Color(0xFFD0E1FD), fontSize: 11, fontFamily: "monospace"),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                            child: Text(_profile.bloodGroup, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.primary)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Button: View Medical Passport QR
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: _showQrPassportModal,
                          icon: const Icon(Icons.qr_code, size: 18, color: Colors.white),
                          label: Text(
                            I18nService.t('patient.viewQr'),
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Colors.white38),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Profile Readiness Progress Bar
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.shield_outlined, color: AppTheme.primary, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  I18nService.t('patient.completeness'),
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF64748B)),
                                ),
                                Text(
                                  "$_completeness% ${I18nService.t('patient.ready')}",
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppTheme.primary),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: _completeness / 100,
                                backgroundColor: const Color(0xFFEEF3FF),
                                valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                                minHeight: 5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Tab Bar
                Container(
                  color: Colors.white,
                  child: TabBar(
                    controller: _tabController,
                    isScrollable: true,
                    labelColor: AppTheme.primary,
                    unselectedLabelColor: const Color(0xFF64748B),
                    labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                    indicatorColor: AppTheme.primary,
                    tabs: [
                      Tab(text: "${I18nService.t('patient.allergies')} (${_profile.allergies.length})"),
                      Tab(text: "${I18nService.t('patient.vaultDocs')} (${_documents.length})"),
                      Tab(text: "${I18nService.t('patient.medications')} (${_profile.medications.length})"),
                      Tab(text: "${lang == 'hi' ? 'केयर इतिहास' : 'Care History'} (${_visitHistory.length})"),
                      Tab(text: I18nService.t('patient.personalKin')),
                    ],
                  ),
                ),

                // Tab Views
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _allergiesTab(),
                      _vaultTab(),
                      _medicationsTab(),
                      _historyTab(lang),
                      _personalTab(),
                    ],
                  ),
                ),

                // Fixed Action Bar at Bottom
                Container(
                  padding: const EdgeInsets.all(12),
                  color: Colors.white,
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => _saveProfile(_profile),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          child: Text(I18nService.t('patient.saveChanges'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const LocationCaptureScreen()),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF050B18),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          child: Text(
                            I18nService.t('patient.emergencyMode'),
                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // TAB 1: Allergies & Chronic Conditions
  Widget _allergiesTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Critical Allergies Header Card
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFFFFBEB),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFFDE68A)),
          ),
          child: Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: Color(0xFFD97706), size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  I18nService.t('patient.criticalAllergies'),
                  style: const TextStyle(color: Color(0xFF92400E), fontWeight: FontWeight.w900, fontSize: 11),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Quick Common Allergen Chips
        const Text(
          "Quick Select Common Allergen:",
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: _commonAllergens.map((item) {
            final alreadyAdded = _profile.allergies.any((a) => a.name.toLowerCase().contains(item.toLowerCase()));
            return ActionChip(
              label: Text(item, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: alreadyAdded ? Colors.white : const Color(0xFF0F172A))),
              backgroundColor: alreadyAdded ? AppTheme.primary : Colors.white,
              onPressed: () {
                if (alreadyAdded) return;
                final newItem = AllergyItem(
                  id: "a_${DateTime.now().millisecondsSinceEpoch}",
                  name: item,
                  category: item.contains("Peanuts") ? "Food" : "Drug",
                  severity: item.contains("Penicillin") ? "Severe / Anaphylaxis" : "Moderate",
                );
                _saveProfile(_profile.copyWith(allergies: [..._profile.allergies, newItem]));
              },
            );
          }).toList(),
        ),
        const SizedBox(height: 16),

        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                I18nService.t('patient.allergies'),
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            TextButton.icon(
              onPressed: _showAddAllergyDialog,
              icon: const Icon(Icons.add, size: 16),
              label: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(I18nService.t('patient.addAllergy')),
              ),
            ),
          ],
        ),

        ..._profile.allergies.map((a) => Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: a.severity.contains("Severe") ? const Color(0xFFFECACA) : const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.report_problem,
                  size: 16,
                  color: Color(0xFFD97706),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(a.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    Text("${a.category} Allergen • ${a.severity}", style: TextStyle(fontSize: 11, color: a.severity.contains("Severe") ? const Color(0xFFD97706) : const Color(0xFF64748B))),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 18, color: Color(0xFF94A3B8)),
                onPressed: () => _saveProfile(_profile.copyWith(allergies: _profile.allergies.where((item) => item.id != a.id).toList())),
              ),
            ],
          ),
        )),

        const SizedBox(height: 20),
        // Chronic Conditions Section
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(I18nService.t('patient.chronicConditions'), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: Color(0xFF64748B))),
            TextButton.icon(
              onPressed: _showAddConditionDialog,
              icon: const Icon(Icons.add, size: 16),
              label: Text(I18nService.t('patient.addCondition')),
            ),
          ],
        ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _profile.chronicConditions.map((cond) {
            return Chip(
              label: Text(cond, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primary)),
              backgroundColor: const Color(0xFFEEF3FF),
              deleteIcon: const Icon(Icons.close, size: 14),
              onDeleted: () {
                _saveProfile(_profile.copyWith(
                  chronicConditions: _profile.chronicConditions.where((c) => c != cond).toList(),
                ));
              },
            );
          }).toList(),
        ),
      ],
    );
  }

  void _showAddAllergyDialog() {
    final nameCtrl = TextEditingController();
    String category = "Drug";
    String severity = "Severe / Anaphylaxis";

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(I18nService.t('patient.addAllergy')),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: InputDecoration(labelText: I18nService.t('patient.allergenName')),
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: category,
                decoration: const InputDecoration(labelText: "Category"),
                items: ["Drug", "Food", "Environmental", "Other"]
                    .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                    .toList(),
                onChanged: (val) => setDState(() => category = val ?? "Drug"),
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: severity,
                decoration: const InputDecoration(labelText: "Severity"),
                items: ["Severe / Anaphylaxis", "Moderate", "Mild"]
                    .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                    .toList(),
                onChanged: (val) => setDState(() => severity = val ?? "Moderate"),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: Text(I18nService.t('patient.close'))),
            ElevatedButton(
              onPressed: () {
                if (nameCtrl.text.trim().isEmpty) return;
                final item = AllergyItem(
                  id: "a_${DateTime.now().millisecondsSinceEpoch}",
                  name: nameCtrl.text.trim(),
                  category: category,
                  severity: severity,
                );
                _saveProfile(_profile.copyWith(allergies: [..._profile.allergies, item]));
                Navigator.pop(ctx);
              },
              child: const Text("Add"),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddConditionDialog() {
    final condCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(I18nService.t('patient.addCondition')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: condCtrl,
              decoration: const InputDecoration(labelText: "Condition Name (e.g. Asthma)"),
            ),
            const SizedBox(height: 10),
            const Text("Quick suggestions:", style: TextStyle(fontSize: 10, color: Color(0xFF64748B))),
            Wrap(
              spacing: 4,
              children: _commonConditions.map((sug) => ActionChip(
                label: Text(sug, style: const TextStyle(fontSize: 10)),
                onPressed: () => condCtrl.text = sug,
              )).toList(),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(I18nService.t('patient.close'))),
          ElevatedButton(
            onPressed: () {
              if (condCtrl.text.trim().isEmpty) return;
              _saveProfile(_profile.copyWith(
                chronicConditions: [..._profile.chronicConditions, condCtrl.text.trim()],
              ));
              Navigator.pop(ctx);
            },
            child: const Text("Add"),
          ),
        ],
      ),
    );
  }

  // TAB 2: Vault Docs & Prescriptions
  Widget _vaultTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                I18nService.t('patient.vaultDocs'),
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton.icon(
              onPressed: _pickAndUploadDocument,
              icon: const Icon(Icons.upload_file, size: 16),
              label: const FittedBox(
                fit: BoxFit.scaleDown,
                child: Text("Upload Document"),
              ),
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
            ),
          ],
        ),
        const SizedBox(height: 10),
        ..._documents.map((d) => Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE2E8F0))),
          child: Row(
            children: [
              Icon(d.fileType == "pdf" ? Icons.picture_as_pdf : Icons.image, color: AppTheme.primary, size: 24),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(d.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    Text("${d.category} • ${d.doctorName} • ${d.fileSize}", style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 18, color: Color(0xFF94A3B8)),
                onPressed: () async {
                  await StorageService.deleteDocument(d.id);
                  _loadData();
                },
              ),
            ],
          ),
        )),
      ],
    );
  }

  // TAB 3: Ongoing Medications
  Widget _medicationsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                I18nService.t('patient.activeMedications'),
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: Color(0xFF64748B)),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            TextButton.icon(
              onPressed: _showAddMedDialog,
              icon: const Icon(Icons.add, size: 16),
              label: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(I18nService.t('patient.addMed')),
              ),
            ),
          ],
        ),
        ..._profile.medications.map((m) => Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE2E8F0))),
          child: Row(
            children: [
              const Icon(Icons.medication, color: AppTheme.primary, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("${m.name} • ${m.dosage}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    Text("${m.frequency} (${m.prescribedFor})", style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 18, color: Color(0xFF94A3B8)),
                onPressed: () => _saveProfile(_profile.copyWith(medications: _profile.medications.where((item) => item.id != m.id).toList())),
              ),
            ],
          ),
        )),
      ],
    );
  }

  void _showAddMedDialog() {
    final nameCtrl = TextEditingController();
    final doseCtrl = TextEditingController();
    final freqCtrl = TextEditingController(text: "Once daily");
    final forCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(I18nService.t('patient.addMed')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: "Medicine Name")),
            TextField(controller: doseCtrl, decoration: const InputDecoration(labelText: "Dosage (e.g. 10mg)")),
            TextField(controller: freqCtrl, decoration: const InputDecoration(labelText: "Frequency (e.g. At night)")),
            TextField(controller: forCtrl, decoration: const InputDecoration(labelText: "Prescribed For (e.g. Asthma)")),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(I18nService.t('patient.close'))),
          ElevatedButton(
            onPressed: () {
              if (nameCtrl.text.trim().isEmpty) return;
              final item = MedicationItem(
                id: "m_${DateTime.now().millisecondsSinceEpoch}",
                name: nameCtrl.text.trim(),
                dosage: doseCtrl.text.trim().isNotEmpty ? doseCtrl.text.trim() : "Standard",
                frequency: freqCtrl.text.trim(),
                prescribedFor: forCtrl.text.trim().isNotEmpty ? forCtrl.text.trim() : "Maintenance",
              );
              _saveProfile(_profile.copyWith(medications: [..._profile.medications, item]));
              Navigator.pop(ctx);
            },
            child: const Text("Save"),
          ),
        ],
      ),
    );
  }

  // TAB 4: Personal, Emergency Kin, and Organ Donor
  Widget _personalTab() {
    final nameCtrl = TextEditingController(text: _profile.fullName);
    final phoneCtrl = TextEditingController(text: _profile.phone);
    final ageCtrl = TextEditingController(text: _profile.age);
    final kinCtrl = TextEditingController(text: _profile.emergencyContactName);
    final kinPhoneCtrl = TextEditingController(text: _profile.emergencyContactPhone);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // 1-Click Call Kin Banner
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFEEF3FF),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFD0E1FD)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("EMERGENCY KIN CONTACT", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF64748B))),
                    Text(
                      "${_profile.emergencyContactName} (${_profile.emergencyContactRelation})",
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      _profile.emergencyContactPhone,
                      style: const TextStyle(fontSize: 11, color: AppTheme.primary, fontWeight: FontWeight.bold),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton.icon(
                onPressed: _callKin,
                icon: const Icon(Icons.phone, size: 16),
                label: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(I18nService.t('patient.callKin')),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Organ Donor Pledge Switch
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: SwitchListTile(
            title: Text(I18nService.t('patient.organDonor'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            subtitle: Text(I18nService.t('patient.organDonorDesc'), style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
            value: _profile.organDonor,
            activeColor: const Color(0xFF059669),
            onChanged: (val) {
              _saveProfile(_profile.copyWith(organDonor: val));
            },
          ),
        ),
        const SizedBox(height: 10),

        // Auto-Share in Emergency Switch
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: SwitchListTile(
            title: Text(I18nService.t('patient.autoShare'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            subtitle: Text(I18nService.t('patient.autoShareDesc'), style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
            value: _profile.autoShareInEmergency,
            activeColor: AppTheme.primary,
            onChanged: (val) {
              _saveProfile(_profile.copyWith(autoShareInEmergency: val));
            },
          ),
        ),
        const SizedBox(height: 16),

        // Demographics Form
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            children: [
              TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: "Full Name")),
              const SizedBox(height: 10),
              TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: "Phone Number")),
              const SizedBox(height: 10),
              TextField(controller: ageCtrl, decoration: const InputDecoration(labelText: "Age")),
              const SizedBox(height: 10),
              TextField(controller: kinCtrl, decoration: const InputDecoration(labelText: "Emergency Kin Full Name")),
              const SizedBox(height: 10),
              TextField(controller: kinPhoneCtrl, decoration: const InputDecoration(labelText: "Emergency Kin Phone")),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => _saveProfile(_profile.copyWith(
                    fullName: nameCtrl.text.trim(),
                    phone: phoneCtrl.text.trim(),
                    age: ageCtrl.text.trim(),
                    emergencyContactName: kinCtrl.text.trim(),
                    emergencyContactPhone: kinPhoneCtrl.text.trim(),
                  )),
                  child: const Text("Save Personal Details"),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _historyTab(String lang) {
    if (_visitHistory.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: Color(0xFFEEF3FF),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.history_edu, color: AppTheme.primary, size: 36),
              ),
              const SizedBox(height: 16),
              Text(
                lang == 'hi' ? "कोई आपातकालीन इतिहास नहीं" : "No Emergency Visits Recorded",
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppTheme.darkNavy),
              ),
              const SizedBox(height: 6),
              Text(
                lang == 'hi'
                    ? "जब आप किसी अस्पताल में आपातकालीन सहायता लेते हैं, तो उसका पूरा विवरण यहाँ सुरक्षित होगा।"
                    : "Completed emergency hospital admissions and triage handovers will be automatically recorded here.",
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _visitHistory.length,
      itemBuilder: (ctx, idx) {
        final visit = _visitHistory[idx];
        return Container(
          margin: const EdgeInsets.only(bottom: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Header with Case ID and Status Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                  border: Border.all(color: const Color(0xFFF1F5F9)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              visit.caseId,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                fontFamily: "monospace",
                                color: AppTheme.primary,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              visit.timestamp,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0xFFA7F3D0)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.check_circle, color: Color(0xFF059669), size: 12),
                          const SizedBox(width: 4),
                          Text(
                            visit.status,
                            style: const TextStyle(
                              color: Color(0xFF059669),
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Hospital Name & Acuity Info
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEEF3FF),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.local_hospital, color: AppTheme.primary, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                visit.hospitalName,
                                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppTheme.darkNavy),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                visit.hospitalAddress,
                                style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Badges row: Condition, Bed, Corridor
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFBFDBFE)),
                          ),
                          child: Text(
                            visit.emergencyType,
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.primary),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFA7F3D0)),
                          ),
                          child: Text(
                            visit.triageBay,
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF059669)),
                          ),
                        ),
                        if (visit.greenCorridorUsed)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF0FDF4),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFF86EFAC)),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.traffic, size: 11, color: Color(0xFF16A34A)),
                                SizedBox(width: 4),
                                Text(
                                  "Green Corridor Used",
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF16A34A)),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Attending Doctor in Charge card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.badge_outlined, size: 16, color: AppTheme.primary),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              "Attending Doctor: ${visit.doctorInChargeName} (${visit.doctorInChargeRole})",
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.darkNavy),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

