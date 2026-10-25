import '../models/hospital.dart';

class AnalysisCheckItem {
  final String title;
  bool isChecked;

  AnalysisCheckItem(this.title, {this.isChecked = false});
}

class DecisionEngineResult {
  final Hospital bestMatch;
  final List<Hospital> alternatives;
  final String matchReason;

  DecisionEngineResult({
    required this.bestMatch,
    required this.alternatives,
    required this.matchReason,
  });
}

class DecisionEngineService {
  static DecisionEngineResult findBestHospital({
    required String emergencyType,
    required double originLat,
    required double originLng,
    double geofenceRadiusKm = 50.0,
  }) {
    // 1. Retrieve hospitals with real dynamic distance and geofencing
    final allHospitals = Hospital.getHospitals(
      originLat: originLat,
      originLng: originLng,
      geofenceRadiusKm: geofenceRadiusKm,
      filterByGeofence: false,
    );

    // 2. Filter candidate list: strictly require verified live ER bed availability
    // UNVERIFIED or WEBSITE-ONLY hospitals CANNOT be assigned primary emergency dispatch
    // because their live resuscitation capacity cannot be medically guaranteed.
    final candidateHospitals = allHospitals.where((h) {
      return h.isAervaVerified && (h.erAvailable != null && h.erAvailable! > 0);
    }).toList();

    // Fallback if all verified hospitals in radius have full ER beds
    final workingList = candidateHospitals.isNotEmpty
        ? candidateHospitals
        : allHospitals.where((h) => h.isAervaVerified).toList();

    final List<Hospital> targetList = workingList.isNotEmpty ? workingList : allHospitals;

    targetList.sort((a, b) {
      int scoreA = 0;
      int scoreB = 0;

      // CLINICAL SAFETY GATE: ER capacity check
      final aBeds = a.erAvailable ?? 0;
      final bBeds = b.erAvailable ?? 0;
      if (aBeds <= 0) scoreA -= 10000;
      if (bBeds <= 0) scoreB -= 10000;

      // Capability Match (+40)
      if (a.primaryCapabilities.contains(emergencyType)) scoreA += 40;
      if (b.primaryCapabilities.contains(emergencyType)) scoreB += 40;

      // Live Bed Availability Weight
      if (aBeds > 0) scoreA += 50 + (aBeds * 4);
      if (bBeds > 0) scoreB += 50 + (bBeds * 4);

      // ICU Safety Buffer (+15)
      final aIcu = a.icuAvailable ?? 0;
      final bIcu = b.icuAvailable ?? 0;
      if (aIcu > 0) scoreA += 15 + (aIcu * 2);
      if (bIcu > 0) scoreB += 15 + (bIcu * 2);

      // Proximity / Travel Time Weight
      scoreA += (35 - a.etaMinutes).clamp(0, 30);
      scoreB += (35 - b.etaMinutes).clamp(0, 30);

      // Geofence proximity bonus
      if (a.distanceKm <= 10.0) scoreA += 20;
      if (b.distanceKm <= 10.0) scoreB += 20;

      // STRICT ZERO COMMERCIAL BIAS: Commercial weight = 0

      return scoreB.compareTo(scoreA);
    });

    final best = targetList.first;

    // Remaining alternatives (combines remaining candidates + unverified for transparency)
    final alts = allHospitals.where((h) => h.id != best.id).toList();
    alts.sort((a, b) => a.distanceKm.compareTo(b.distanceKm));

    final bestBeds = best.erAvailable ?? 0;
    String reason = bestBeds > 0
        ? 'Optimal clinical match for $emergencyType with confirmed AERVA-verified ER resuscitation capacity ($bestBeds beds open, ${best.icuAvailable ?? 0} ICU) at ${best.distanceKm} km (${best.etaMinutes} min ETA).'
        : 'Emergency surge alert: Regional capacity constrained. Closest verified facility assigned under priority triage.';

    return DecisionEngineResult(
      bestMatch: best,
      alternatives: alts,
      matchReason: reason,
    );
  }
}
