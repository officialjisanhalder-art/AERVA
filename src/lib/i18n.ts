// NearER Master Bilingual Strings — English + Hindi
// Usage: import { t } from "@/lib/i18n"; then t("key", lang)

export type Lang = "en" | "hi";

export const strings: Record<string, Record<Lang, string>> = {
  // Nav
  "nav.home": { en: "Home", hi: "होम" },
  "nav.patientPortal": { en: "Patient Portal", hi: "मरीज़ पोर्टल" },
  "nav.reach": { en: "NearER Reach", hi: "NearER रीच" },
  "nav.operatorDesk": { en: "Operator Desk", hi: "ऑपरेटर डेस्क" },
  "nav.forHospitals": { en: "For Hospitals", hi: "अस्पतालों के लिए" },
  "nav.patientPassport": { en: "Patient Passport", hi: "मेरी प्रोफाइल" },
  "nav.emergencyCare": { en: "Emergency Care", hi: "आपातकालीन सेवा" },
  "nav.trafficTowers": { en: "Traffic Towers", hi: "ट्रैफिक टावर्स" },
  "nav.evidence": { en: "AI Evidence", hi: "AI साक्ष्य एवं ऑडिट" },
  "nav.getStarted": { en: "Get Started", hi: "शुरू करें" },

  // Hero Section
  "hero.badge": { en: "Real-Time Hospital Decision Engine", hi: "रियल-टाइम अस्पताल निर्णय इंजन" },
  "hero.title1": { en: "Don’t just find the nearest hospital.", hi: "सिर्फ नजदीकी अस्पताल मत खोजिए।" },
  "hero.title2": { en: "Find the right one.", hi: "सही अस्पताल खोजिए।" },
  "hero.subtitle": { 
    en: "In a medical emergency, the nearest clinic may not have an available ICU bed, on-duty cardiologist, or blood supply. NearER routes you instantly to the hospital that is fully ready to save your life.", 
    hi: "आपात स्थिति में, नजदीकी क्लिनिक में ICU बेड, ड्यूटी पर हृदय रोग विशेषज्ञ या रक्त उपलब्ध नहीं हो सकता। NearER आपको तुरंत उस अस्पताल में भेजता है जो आपकी जान बचाने के लिए पूरी तरह तैयार है।" 
  },
  "hero.btn.emergency": { en: "Find Emergency Care", hi: "आपातकालीन सहायता खोजें" },
  "hero.btn.passport": { en: "Patient Passport", hi: "मरीज़ पासपोर्ट" },
  "hero.btn.partner": { en: "Hospital Portal", hi: "अस्पताल पोर्टल" },
  "hero.quickSelect": { en: "QUICK EMERGENCY SELECTOR", hi: "त्वरित आपातकालीन चयन" },

  // Emergencies
  "emergency.cardiac": { en: "Chest Pain / Cardiac", hi: "सीने में दर्द / हृदय" },
  "emergency.stroke": { en: "Stroke / Numbness", hi: "स्ट्रोक / सुन्नता" },
  "emergency.trauma": { en: "Accident / Trauma", hi: "दुर्घटना / आघात" },
  "emergency.respiratory": { en: "Severe Breathing", hi: "सांस लेने में तकलीफ" },
  "emergency.bleeding": { en: "Severe Bleeding", hi: "गंभीर रक्तस्राव" },
  "emergency.burns": { en: "Burns", hi: "जलना" },
  "emergency.breathing": { en: "Breathing Problem", hi: "सांस की समस्या" },
  "emergency.other": { en: "Other Medical Crisis", hi: "अन्य आपातकाल" },

  // Location Page
  "location.title": { en: "Emergency Location", hi: "आपातकालीन स्थान" },
  "location.detecting": { en: "Detecting your live GPS location...", hi: "आपका लाइव GPS स्थान पता लगाया जा रहा है..." },
  "location.detected": { en: "Location Confirmed", hi: "स्थान सत्यापित" },
  "location.btn.proceed": { en: "Proceed to Hospital Matching", hi: "अस्पताल मिलान जारी रखें" },
  "location.change": { en: "Change Location", hi: "स्थान बदलें" },
  "location.save": { en: "Save Location", hi: "स्थान सहेजें" },

  // Hospitals List Page
  "hospitals.title": { en: "Nearby Hospitals", hi: "निकटतम अस्पताल" },
  "hospitals.radius": { en: "Current Location Radius", hi: "वर्तमान स्थान दायरा" },
  "hospitals.discovered": { en: "Discovered", hi: "खोजे गए" },
  "hospitals.heading": { en: "Hospitals In Your Area", hi: "आपके क्षेत्र के अस्पताल" },
  "hospitals.subheading": { en: "Live status, capacity & capabilities detected around you", hi: "आपके आसपास की लाइव स्थिति, क्षमता और विशेषज्ञ" },
  "hospitals.list": { en: "List", hi: "सूची" },
  "hospitals.map": { en: "Map", hi: "नक्शा" },
  "hospitals.erStatus": { en: "ER Status", hi: "ER स्थिति" },
  "hospitals.icuCapacity": { en: "ICU Capacity", hi: "ICU क्षमता" },
  "hospitals.waitTime": { en: "Wait Time", hi: "प्रतीक्षा समय" },
  "hospitals.erBeds": { en: "ER Beds", hi: "ER बेड" },
  "hospitals.specialists": { en: "On-Duty Specialists", hi: "ड्यूटी पर मौजूद विशेषज्ञ" },
  "hospitals.bloodBank": { en: "Blood Bank", hi: "ब्लड बैंक" },
  "hospitals.continue": { en: "Select Emergency Type & Continue", hi: "आपातकाल चुनें और आगे बढ़ें" },
  "hospitals.bedsFree": { en: "Beds Free", hi: "बेड खाली" },
  "hospitals.erFull": { en: "ER Full", hi: "ER भरा हुआ" },

  // Emergency Selection Page
  "selection.step1": { en: "Emergency Type", hi: "आपातकाल प्रकार" },
  "selection.step2": { en: "Patient Registration", hi: "मरीज़ पंजीकरण" },
  "selection.heading": { en: "What is the emergency?", hi: "आपातकाल क्या है?" },
  "selection.subheading": { 
    en: "NearER matches specialized on-duty doctors and equipment based on this category", 
    hi: "NearER इस श्रेणी के आधार पर ऑन-ड्यूटी डॉक्टर और उपकरण खोजता है" 
  },
  "selection.proceedBtn": { en: "Proceed to Patient Registration", hi: "मरीज़ पंजीकरण पर आगे बढ़ें" },
  "selection.findBtn": { en: "Find Right Hospital", hi: "सही अस्पताल खोजें" },
  "selection.changeType": { en: "Change Emergency Type", hi: "आपातकाल प्रकार बदलें" },

  // Patient Registration Form
  "form.triageBadge": { en: "EMERGENCY TRIAGE INTAKE", hi: "आपातकालीन ट्राइएज इनटेक" },
  "form.title": { en: "Patient Registration", hi: "मरीज़ पंजीकरण" },
  "form.subtitle": { 
    en: "Fast identification for the receiving hospital ER staff & doctor prep", 
    hi: "अस्पताल स्टाफ और डॉक्टरों की त्वरित तैयारी के लिए" 
  },
  "form.passportLinked": { en: "Patient Health Passport Linked", hi: "स्वास्थ्य पासपोर्ट जुड़ा हुआ है" },
  "form.name": { en: "Patient Full Name *", hi: "मरीज़ का पूरा नाम *" },
  "form.phone": { en: "Contact Phone Number *", hi: "संपर्क फ़ोन नंबर *" },
  "form.age": { en: "Approx. Age", hi: "अनुमानित आयु" },
  "form.gender": { en: "Gender", hi: "लिंग" },
  "form.gender.male": { en: "Male", hi: "पुरुष" },
  "form.gender.female": { en: "Female", hi: "महिला" },
  "form.gender.other": { en: "Other", hi: "अन्य" },
  "form.bloodGroup": { en: "Blood Group (Optional)", hi: "रक्त समूह (वैकल्पिक)" },
  "form.voiceTitle": { en: "Tell the hospital what happened", hi: "अस्पताल को बताएं क्या हुआ" },
  "form.voiceSub": { 
    en: "Optional: Record a short voice brief for incoming ER doctors.", 
    hi: "वैकल्पिक: आने वाले डॉक्टरों के लिए छोटा वॉयस संदेश रिकॉर्ड करें।" 
  },
  "form.recordBtn": { en: "Record Voice Brief", hi: "वॉयस संदेश रिकॉर्ड करें" },
  "form.stopBtn": { en: "Stop", hi: "रोकें" },
  "form.cancelBtn": { en: "Cancel", hi: "रद्द करें" },
  "form.playBtn": { en: "Play", hi: "सुनें" },
  "form.rerecordBtn": { en: "Re-record", hi: "पुनः रिकॉर्ड करें" },
  "form.ambulanceTitle": { en: "Ambulance Dispatch Preference", hi: "एम्बुलेंस प्रेषण प्राथमिकता" },
  "form.ambulanceRequired": { en: "Emergency Ambulance Required", hi: "आपातकालीन एम्बुलेंस आवश्यक है" },
  "form.ambulanceRequiredSub": { en: "Dispatch nearest Mobile ICU / ALS unit to my current location immediately", hi: "मेरे वर्तमान स्थान पर तुरंत निकटतम मोबाइल ICU / ALS एम्बुलेंस भेजें" },
  "form.ambulanceNotRequired": { en: "Self-Transport / Not Required", hi: "स्वयं का वाहन / आवश्यकता नहीं" },
  "form.ambulanceNotRequiredSub": { en: "I will travel using own vehicle, taxi, or walking. Just guide me to the hospital.", hi: "मैं अपने वाहन या टैक्सी से जाऊंगा। केवल अस्पताल का रास्ता दिखाएं।" },

  // Recommendation Page
  "rec.title": { en: "Best Emergency Destination", hi: "सर्वश्रेष्ठ आपातकालीन अस्पताल" },
  "rec.subtitle": { en: "Based on real-time capacity and your emergency type", hi: "लाइव क्षमता और आपातकाल के प्रकार के आधार पर" },
  "rec.bestMatch": { en: "BEST MATCH", hi: "सर्वश्रेष्ठ मिलान" },
  "rec.liveVerified": { en: "LIVE VERIFIED", hi: "लाइव सत्यापित" },
  "rec.erAvailable": { en: "ER Available", hi: "ER उपलब्ध" },
  "rec.icuAvailable": { en: "ICU Available", hi: "ICU उपलब्ध" },
  "rec.bloodAvailable": { en: "Blood Bank Available", hi: "ब्लड बैंक उपलब्ध" },
  "rec.whyTitle": { en: "Why NearER selected this hospital", hi: "NearER ने यह अस्पताल क्यों चुना" },
  "rec.sendSOS": { en: "SEND EMERGENCY REQUEST", hi: "आपातकालीन अनुरोध भेजें" },
  "rec.callFirst": { en: "Call hospital first to confirm availability", hi: "उपलब्धता की पुष्टि के लिए पहले अस्पताल को कॉल करें" },
  "rec.alternatives": { en: "Other suitable hospitals", hi: "अन्य उपयुक्त अस्पताल" },
  "rec.sendHere": { en: "Send Here", hi: "यहाँ भेजें" },

  // SOS Confirmation Modal
  "sos.confirm.title": { en: "Confirm Emergency Request", hi: "आपातकालीन अनुरोध की पुष्टि करें" },
  "sos.confirm.body": { en: "This sends a live alert ONLY to", hi: "यह केवल इस अस्पताल को लाइव अलर्ट भेजेगा:" },
  "sos.confirm.note": { en: "No other hospital or public system will see this request.", hi: "कोई अन्य अस्पताल या सार्वजनिक प्रणाली यह अनुरोध नहीं देखेगी।" },
  "sos.confirm.accountability": { en: "Patient Care Accountability", hi: "मरीज़ देखभाल जवाबदेही" },
  "sos.confirm.accountability.body": {
    en: "NearER tracks this case. If this hospital accepts you but delays proper treatment, the case will be flagged and reported in their reliability score.",
    hi: "NearER इस केस को ट्रैक करता है। यदि यह अस्पताल आपको स्वीकार करके उचित उपचार में देरी करता है, तो उनकी विश्वसनीयता रेटिंग प्रभावित होगी।"
  },
  "sos.confirm.send": { en: "Confirm & Send Alert", hi: "पुष्टि करें और अलर्ट भेजें" },
  "sos.confirm.cancel": { en: "Cancel", hi: "रद्द करें" },
  "sos.estimatedArrival": { en: "Estimated arrival", hi: "अनुमानित पहुंच समय" },

  // Traffic Police Green Corridor Signal
  "traffic.badge": { en: "TRAFFIC POLICE GREEN CORRIDOR", hi: "ट्रैफिक पुलिस ग्रीन कॉरिडोर" },
  "traffic.status": { en: "Emergency Route Broadcasted", hi: "आपातकालीन मार्ग प्रसारित" },
  "traffic.desc": { 
    en: "Live GPS telemetry and transit corridor broadcasted to Traffic Control Room for signal priority and road clearance.", 
    hi: "सिग्नल प्राथमिकता और रास्ता साफ कराने के लिए लाइव GPS और मार्ग ट्रैफिक कंट्रोल रूम को भेजा गया।" 
  },
  "traffic.activeSignals": { en: "Traffic Signals Pre-Alerted", hi: "अलर्ट किए गए ट्रैफिक सिग्नल" },

  // Emergency Status
  "status.title": { en: "Emergency Status", hi: "आपातकालीन स्थिति" },
  "status.activeEmergency": { en: "Active Emergency", hi: "सक्रिय आपातकाल" },
  "status.live": { en: "LIVE", hi: "लाइव" },
  "status.hospital": { en: "Hospital", hi: "अस्पताल" },
  "status.voiceNoteSent": { en: "Voice Note Sent", hi: "वॉयस नोट भेजा गया" },
  "status.callHospital": { en: "Call Hospital", hi: "अस्पताल को कॉल करें" },
  "status.messageHospital": { en: "Message Hospital", hi: "अस्पताल को संदेश भेजें" },
  "status.openRoute": { en: "Open Navigation", hi: "नेविगेशन खोलें" },
  "status.timelineTitle": { en: "Emergency Timeline", hi: "आपातकालीन समयरेखा" },
  "status.step.location": { en: "Live Location Captured", hi: "लाइव स्थान दर्ज किया गया" },
  "status.step.submitted": { en: "Emergency Submitted", hi: "आपातकाल दर्ज किया गया" },
  "status.step.voice": { en: "Voice Note Delivered", hi: "वॉयस नोट भेजा गया" },
  "status.step.reviewing": { en: "Hospital Reviewing", hi: "अस्पताल समीक्षा कर रहा है" },
  "status.step.verified": { en: "Request Verified", hi: "अनुरोध सत्यापित" },
  "status.step.accepted": { en: "Hospital Accepted", hi: "अस्पताल ने स्वीकार किया" },
  "status.step.reserved": { en: "Capacity Temporarily Reserved", hi: "क्षमता अस्थायी रूप से आरक्षित" },
  "status.step.navigating": { en: "Navigating to Hospital", hi: "अस्पताल की ओर नेविगेट कर रहे हैं" },
  "status.step.arrived": { en: "Arrived", hi: "पहुंच गए" },
  "status.startingNav": { en: "Starting Navigation...", hi: "नेविगेशन शुरू हो रहा है..." },
  "status.redirecting": { en: "Hospital accepted your emergency. Opening Maps...", hi: "अस्पताल ने स्वीकार किया। मैप्स खुल रहा है..." },

  // Doctor In Charge & Capacity
  "doctor.inCharge": { en: "Doctor in Charge", hi: "प्रभारी डॉक्टर" },
  "doctor.dutyLead": { en: "Emergency Duty Lead", hi: "आपातकालीन ड्यूटी प्रमुख" },
  "doctor.onDuty": { en: "On Duty", hi: "ड्यूटी पर" },
  "doctor.offDuty": { en: "Off Duty", hi: "ड्यूटी समाप्त" },
  "doctor.regNo": { en: "Reg. No", hi: "पंजीकरण संख्या" },
  "doctor.shift": { en: "Duty Shift", hi: "ड्यूटी शिफ्ट" },
  "doctor.ext": { en: "Intercom Ext", hi: "इंटरकॉम एक्सटेंशन" },
  "capacity.title": { en: "Capacity & Beds Management", hi: "क्षमता और बेड प्रबंधन" },
  "capacity.save": { en: "Save Updates", hi: "अपडेट सहेजें" },
  "capacity.saved": { en: "Live Capacity & Duty Doctor Saved", hi: "लाइव क्षमता और ड्यूटी डॉक्टर सहेजे गए" },
  "capacity.broadcasted": { en: "Broadcasted across NearER triage network", hi: "NearER ट्राइएज नेटवर्क पर प्रसारित" },
  "capacity.erBeds": { en: "ER Beds", hi: "ER बेड" },
  "capacity.icuBeds": { en: "ICU Beds", hi: "ICU बेड" },
  "capacity.ventilators": { en: "Ventilators", hi: "वेंटिलेटर" },
  "capacity.otRooms": { en: "OT Rooms", hi: "ऑपरेशन थिएटर" },

  // Patient Health Passport & Portal
  "patient.portalTitle": { en: "Patient Health Passport", hi: "मरीज़ स्वास्थ्य पासपोर्ट" },
  "patient.healthId": { en: "NEARER HEALTH ID", hi: "NearER स्वास्थ्य आईडी" },
  "patient.preVerified": { en: "Emergency Pre-Verified", hi: "आपातकालीन पूर्व-सत्यापित" },
  "patient.allergies": { en: "Allergies", hi: "एलर्जी" },
  "patient.prescriptions": { en: "Prescriptions & Reports", hi: "पर्चे और रिपोर्ट" },
  "patient.medications": { en: "Daily Medications", hi: "दैनिक दवाएं" },
  "patient.personal": { en: "Personal & Kin", hi: "व्यक्तिगत व परिजन" },
  "patient.conditions": { en: "Chronic Conditions", hi: "पुरानी बीमारियां" },
  "patient.organDonor": { en: "Registered Organ Donor", hi: "पंजीकृत अंग दाता" },
  "patient.autoShare": { en: "Auto-Share with Attending ER Team", hi: "ड्यूटी ER टीम के साथ स्वतः साझा करें" },
  "patient.qrCode": { en: "Medical Passport QR Code", hi: "मेडिकल पासपोर्ट QR कोड" },
  "patient.activeEmergency": { en: "Active Emergency in Progress", hi: "सक्रिय आपातकाल जारी है" },
  "patient.trackStatus": { en: "View Live Emergency Status", hi: "लाइव आपातकालीन स्थिति देखें" },
  "patient.completeness": { en: "Emergency Readiness", hi: "आपातकालीन तत्परता" },
  "patient.saveChanges": { en: "Save All Changes", hi: "सभी बदलाव सहेजें" },
  "patient.emergencyMode": { en: "Emergency Care →", hi: "आपातकालीन सहायता →" },
  "patient.savedToast": { en: "Medical profile & records synchronized", hi: "चिकित्सा प्रोफ़ाइल और रिकॉर्ड सिंक किए गए" },
  "patient.kinContact": { en: "Emergency Kin Contact", hi: "आपातकालीन परिजन संपर्क" },
  "patient.callKin": { en: "Call Kin", hi: "परिजन को कॉल करें" },
  "patient.uploadDoc": { en: "Upload Record", hi: "रिकॉर्ड अपलोड करें" },
  "patient.addMed": { en: "Add Medication", hi: "दवा जोड़ें" },
  "patient.addAllergy": { en: "Add Allergy", hi: "एलर्जी जोड़ें" },

  // General units
  "general.verified": { en: "Verified", hi: "सत्यापित" },
  "general.unverified": { en: "Unverified", hi: "असत्यापित" },
  "general.etaMin": { en: "min", hi: "मिनट" },
  "general.km": { en: "km", hi: "किमी" },
  "general.beds": { en: "beds", hi: "बेड" },
};

export function t(key: string, lang: Lang = "en"): string {
  return strings[key]?.[lang] ?? strings[key]?.["en"] ?? key;
}
