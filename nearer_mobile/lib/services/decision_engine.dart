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
  }) {
    final hospitals = Hospital.getHospitals();

    hospitals.sort((a, b) {
      int scoreA = 0;
      int scoreB = 0;

      // STRICT HARD GATE: If ER bed is full, hospital CANNOT admit emergency!
      if (a.erAvailable <= 0) scoreA -= 10000;
      if (b.erAvailable <= 0) scoreB -= 10000;

      if (a.primaryCapabilities.contains(emergencyType)) scoreA += 40;
      if (b.primaryCapabilities.contains(emergencyType)) scoreB += 40;

      if (a.erAvailable > 0) scoreA += 50 + (a.erAvailable * 5);
      if (b.erAvailable > 0) scoreB += 50 + (b.erAvailable * 5);

      if (a.icuAvailable > 0) scoreA += 15;
      if (b.icuAvailable > 0) scoreB += 15;

      scoreA += (30 - a.etaMinutes).clamp(0, 25);
      scoreB += (30 - b.etaMinutes).clamp(0, 25);

      return scoreB.compareTo(scoreA);
    });

    final best = hospitals.first;
    final alts = hospitals.sublist(1);

    String reason = best.erAvailable > 0
        ? 'Optimal match for $emergencyType care with active ER resuscitation capacity (${best.erAvailable} beds open) and ${best.etaMinutes} min travel time.'
        : 'Emergency surge alert: ER capacity limited. Priority triage requested.';

    return DecisionEngineResult(
      bestMatch: best,
      alternatives: alts,
      matchReason: reason,
    );
  }
}
