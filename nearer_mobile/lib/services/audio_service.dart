import 'dart:async';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:path_provider/path_provider.dart';

class AudioService {
  static final AudioRecorder _recorder = AudioRecorder();
  static final AudioPlayer _player = AudioPlayer();

  static bool _isRecording = false;
  static bool get isRecording => _isRecording;

  static Future<bool> hasPermission() async {
    return await _recorder.hasPermission();
  }

  static Future<String?> startRecording() async {
    if (!await hasPermission()) return null;
    try {
      final tempDir = await getTemporaryDirectory();
      final path = '${tempDir.path}/emergency_voice_${DateTime.now().millisecondsSinceEpoch}.m4a';
      await _recorder.start(const RecordConfig(encoder: AudioEncoder.aacLc), path: path);
      _isRecording = true;
      return path;
    } catch (_) {
      return null;
    }
  }

  static Future<String?> stopRecording() async {
    try {
      final path = await _recorder.stop();
      _isRecording = false;
      return path;
    } catch (_) {
      _isRecording = false;
      return null;
    }
  }

  static Future<void> playAudio(String path) async {
    try {
      await _player.stop();
      await _player.play(DeviceFileSource(path));
    } catch (_) {}
  }

  static Future<void> pauseAudio() async {
    try {
      await _player.pause();
    } catch (_) {}
  }

  static Future<void> stopAudio() async {
    try {
      await _player.stop();
    } catch (_) {}
  }

  static Stream<PlayerState> get playerStateStream => _player.onPlayerStateChanged;
  static Stream<Duration> get positionStream => _player.onPositionChanged;
  static Stream<Duration> get durationStream => _player.onDurationChanged;
}
