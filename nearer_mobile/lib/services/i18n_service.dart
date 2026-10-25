import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class I18nService {
  static final ValueNotifier<String> currentLang = ValueNotifier<String>('en');

  static const String _key = 'nearer_app_language';

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final lang = prefs.getString(_key) ?? 'en';
    currentLang.value = lang;
  }

  static Future<void> setLanguage(String lang) async {
    currentLang.value = lang;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, lang);
  }

  static void toggleLanguage() {
    if (currentLang.value == 'en') {
      setLanguage('hi');
    } else {
      setLanguage('en');
    }
  }

  static String t(String key) {
    final lang = currentLang.value;
    final map = _localizedValues[lang] ?? _localizedValues['en']!;
    return map[key] ?? _localizedValues['en']?[key] ?? key;
  }

  static final Map<String, Map<String, String>> _localizedValues = {
    'en': {
      'app.title': 'AERVA',
      'app.tagline': 'Autonomous Emergency Routing & Verification Architecture',
      'welcome.getHelp': 'GET EMERGENCY HELP NOW',
      'welcome.getHelpSubtitle': 'Locate nearest trauma center & lock bed',
      'welcome.nearbyHospitals': 'EXPLORE NEARBY HOSPITALS',
      'welcome.nearbyHospitalsSubtitle': 'Check live ER beds & ICU capacity',
      'welcome.patientPassport': 'Patient Health Passport',
      'welcome.activeCase': 'ACTIVE EMERGENCY CASE',
      'welcome.viewStatus': 'VIEW LIVE STATUS',
      'welcome.caseId': 'Case ID',
      'lang.toggle': 'हिंदी',

      // Patient Portal
      'patient.title': 'Patient Health Passport',
      'patient.healthId': 'AERVA HEALTH ID',
      'patient.verified': 'Verified',
      'patient.completeness': 'EMERGENCY READY PROFILE',
      'patient.ready': 'Ready',
      'patient.viewQr': 'View Medical Passport QR',
      'patient.allergies': 'Allergies',
      'patient.vaultDocs': 'Vault Docs',
      'patient.medications': 'Medications',
      'patient.personalKin': 'Personal & Kin',
      'patient.criticalAllergies': 'FLAGGED DRUG & SUBSTANCE ALLERGIES',
      'patient.addAllergy': 'Add Allergy Record',
      'patient.allergenName': 'Allergen Name (e.g. Penicillin)',
      'patient.chronicConditions': 'CHRONIC CONDITIONS & HISTORY',
      'patient.addCondition': 'Add Chronic Condition',
      'patient.activeMedications': 'ACTIVE ONGOING MEDICATIONS',
      'patient.addMed': 'Add Daily Medication',
      'patient.saveChanges': 'Save All Changes',
      'patient.emergencyMode': 'EMERGENCY CARE →',
      'patient.organDonor': 'Pledged Organ Donor',
      'patient.organDonorDesc': 'Authorized for emergency organ donation pledge',
      'patient.autoShare': 'Auto-Share in Emergency Triage',
      'patient.autoShareDesc': 'Immediately transmits passport when booking ER triage',
      'patient.callKin': 'Call Emergency Kin',
      'patient.activeEmergency': 'ACTIVE EMERGENCY UNDERWAY',
      'patient.attendingDoc': 'Attending Doctor',
      'patient.qrModalTitle': 'Medical Passport QR Code',
      'patient.qrModalSubtitle': 'Emergency triage paramedics scan this to read allergies, chronic conditions, and emergency kin in < 2 seconds.',
      'patient.saveLockscreen': 'Save to Lockscreen',
      'patient.printCard': 'Print Wallet Card',
      'patient.close': 'Close',

      // Emergency & Hospitals
      'emergency.nearbyTitle': 'Nearby Hospitals',
      'emergency.doctorInCharge': 'Doctor in Charge',
      'emergency.erAvailable': 'ER Beds Available',
      'emergency.icuAvailable': 'ICU Beds Available',
      'emergency.confirmSos': 'CONFIRM & SEND EMERGENCY SOS',
      'emergency.sendOnlyDedicated': 'SOS alert will be sent ONLY to this dedicated hospital.',
      'emergency.greenCorridor': 'GREEN CORRIDOR ACTIVE',
      'emergency.greenCorridorDesc': 'Traffic Control Room notified. Traffic signals along the route cleared for priority passage.',
      'emergency.bedReserved': 'Bed Reserved in Triage Red Bay',
      'emergency.viewCorridor': 'View Green Corridor Routing',
      'emergency.corridorTitle': 'Green Corridor Clearance Details',
      'emergency.trafficControl': 'Kolkata Traffic Control Room (Sector V Desk)',
      'emergency.signalStatus': 'Signals Synchronized (Priority Green Wave)',
      'emergency.ambulanceRequired': 'Emergency Ambulance Required',
      'emergency.ambulanceRequiredSub': 'Dispatch ALS Mobile ICU to live GPS coordinates immediately',
      'emergency.selfTransport': 'Self-Transport / Not Required',
      'emergency.selfTransportSub': 'Patient travelling independently by car/taxi directly to ER',
      'emergency.alsPriority': 'ALS Priority',
      'emergency.directEntry': 'Direct ER Entry',
      'emergency.needAmbulance': 'Need Ambulance',
      'emergency.trackAmbulance': 'Track Live Ambulance',
      'emergency.callDriver': 'Call Driver',
      'emergency.selfTransportTitle': 'Self-Transport Mode Active',
      'emergency.selfTransportDesc': 'Patient travelling independently to hospital. ER triage alerted for direct arrival.',
      'emergency.startRoute': 'Start Turn-by-Turn Route',
    },
    'hi': {
      'app.title': 'अरवा (AERVA)',
      'app.tagline': 'मिनटों में आपातकालीन चिकित्सा, बिना किसी असमंजस के',
      'welcome.getHelp': 'तुरंत आपातकालीन सहायता प्राप्त करें',
      'welcome.getHelpSubtitle': 'निकटतम ट्रॉमा सेंटर खोजें और बेड सुरक्षित करें',
      'welcome.nearbyHospitals': 'निकटतम अस्पताल देखें',
      'welcome.nearbyHospitalsSubtitle': 'लाइव ईआर बेड और आईसीयू क्षमता जांचें',
      'welcome.patientPassport': 'रोगी स्वास्थ्य पासपोर्ट',
      'welcome.activeCase': 'सक्रिय आपातकालीन मामला',
      'welcome.viewStatus': 'लाइव स्थिति देखें',
      'welcome.caseId': 'केस आईडी',
      'lang.toggle': 'English',

      // Patient Portal
      'patient.title': 'रोगी स्वास्थ्य पासपोर्ट',
      'patient.healthId': 'अरवा स्वास्थ्य पहचान (ID)',
      'patient.verified': 'सत्यापित',
      'patient.completeness': 'आपातकालीन तैयारी प्रोफाइल',
      'patient.ready': 'तैयार',
      'patient.viewQr': 'मेडिकल पासपोर्ट क्यूआर देखें',
      'patient.allergies': 'एलर्जी',
      'patient.vaultDocs': 'दस्तावेज़',
      'patient.medications': 'दवाइयाँ',
      'patient.personalKin': 'व्यक्तिगत और परिजन',
      'patient.criticalAllergies': 'चिह्नित दवा और पदार्थ एलर्जी',
      'patient.addAllergy': 'नई एलर्जी जोड़ें',
      'patient.allergenName': 'एलर्जी का नाम (उदा. पेनिसिलिन)',
      'patient.chronicConditions': 'दीर्घकालिक बीमारियां और इतिहास',
      'patient.addCondition': 'दीर्घकालिक बीमारी जोड़ें',
      'patient.activeMedications': 'सक्रिय नियमित दवाइयाँ',
      'patient.addMed': 'दैनिक दवा जोड़ें',
      'patient.saveChanges': 'सभी बदलाव सहेजें',
      'patient.emergencyMode': 'आपातकालीन सहायता →',
      'patient.organDonor': 'अंगदान संकल्प (Organ Donor)',
      'patient.organDonorDesc': 'आपातकाल में अंगदान संकल्प के लिए अधिकृत',
      'patient.autoShare': 'आपातकालीन ट्रायज में स्वतः साझा करें',
      'patient.autoShareDesc': 'ईआर बुकिंग के समय तत्काल पासपोर्ट साझा करता है',
      'patient.callKin': 'आपातकालीन परिजन को कॉल करें',
      'patient.activeEmergency': 'सक्रिय आपातकाल जारी है',
      'patient.attendingDoc': 'प्रभारी चिकित्सक',
      'patient.qrModalTitle': 'मेडिकल पासपोर्ट क्यूआर कोड',
      'patient.qrModalSubtitle': 'आपातकालीन पैरामेडिक्स 2 सेकंड में एलर्जी और परिजन विवरण पढ़ने के लिए इसे स्कैन करते हैं।',
      'patient.saveLockscreen': 'लॉकस्क्रीन पर सहेजें',
      'patient.printCard': 'वॉलेट कार्ड प्रिंट करें',
      'patient.close': 'बंद करें',

      // Emergency & Hospitals
      'emergency.nearbyTitle': 'निकटतम अस्पताल',
      'emergency.doctorInCharge': 'प्रभारी चिकित्सक (Doctor in Charge)',
      'emergency.erAvailable': 'उपलब्ध ईआर बेड',
      'emergency.icuAvailable': 'उपलब्ध आईसीयू बेड',
      'emergency.confirmSos': 'पुष्टि करें और आपातकालीन SOS भेजें',
      'emergency.sendOnlyDedicated': 'एसओएस केवल इसी समर्पित अस्पताल को भेजा जाएगा।',
      'emergency.greenCorridor': 'ग्रीन कॉरिडोर सक्रिय (Green Corridor Active)',
      'emergency.greenCorridorDesc': 'ट्रैफिक कंट्रोल रूम को सूचित किया गया। मार्ग पर सिग्नल आपातकालीन प्राथमिकता के लिए साफ हैं।',
      'emergency.bedReserved': 'ट्रायज रेड बे में बेड आरक्षित',
      'emergency.viewCorridor': 'ग्रीन कॉरिडोर विवरण देखें',
      'emergency.corridorTitle': 'ग्रीन कॉरिडोर क्लीयरेंस विवरण',
      'emergency.trafficControl': 'कोलकाता ट्रैफिक कंट्रोल रूम (सेक्टर V डेस्क)',
      'emergency.signalStatus': 'सिग्नल सिंक्रोनाइज़्ड (प्राथमिकता ग्रीन वेव)',
      'emergency.ambulanceRequired': 'आपातकालीन एम्बुलेंस आवश्यक है',
      'emergency.ambulanceRequiredSub': 'लाइव जीपीएस स्थान पर तुरंत एएलएस मोबाइल आईसीयू भेजें',
      'emergency.selfTransport': 'स्वयं परिवहन / आवश्यकता नहीं',
      'emergency.selfTransportSub': 'रोगी कार या टैक्सी से सीधे अस्पताल जा रहे हैं',
      'emergency.alsPriority': 'एएलएस प्राथमिकता',
      'emergency.directEntry': 'सीधा ईआर प्रवेश',
      'emergency.needAmbulance': 'एम्बुलेंस चाहिए',
      'emergency.trackAmbulance': 'लाइव एम्बुलेंस ट्रैक करें',
      'emergency.callDriver': 'चालक को कॉल',
      'emergency.selfTransportTitle': 'स्वयं परिवहन मोड सक्रिय',
      'emergency.selfTransportDesc': 'रोगी स्वयं अस्पताल पहुंच रहे हैं। ईआर ट्रायज टीम को सीधे आगमन के लिए सूचित कर दिया गया है।',
      'emergency.startRoute': 'अस्पताल का रास्ता शुरू करें',
    },
  };
}