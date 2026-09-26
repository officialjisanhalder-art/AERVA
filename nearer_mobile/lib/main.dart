import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'screens/splash_screen.dart';
import 'services/i18n_service.dart';
import 'services/supabase_sync_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await I18nService.init();
  await SupabaseSyncService.init();
  runApp(const NearERApp());
}

class NearERApp extends StatelessWidget {
  const NearERApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NearER',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const SplashScreen(),
    );
  }
}
