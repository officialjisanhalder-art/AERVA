import 'dart:async';
import 'package:flutter/material.dart';
import '../services/storage_service.dart';
import 'splash_welcome_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _heartbeatController;
  late Animation<double> _scaleAnimation;
  late AnimationController _rippleController;

  @override
  void initState() {
    super.initState();

    // 1. Authentic ECG systolic / diastolic double-thump heartbeat
    _heartbeatController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 1.0, end: 1.18)
            .chain(CurveTween(curve: Curves.easeOutCubic)),
        weight: 18,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 1.18, end: 1.05)
            .chain(CurveTween(curve: Curves.easeInQuad)),
        weight: 12,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 1.05, end: 1.24)
            .chain(CurveTween(curve: Curves.easeOutCubic)),
        weight: 18,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 1.24, end: 1.0)
            .chain(CurveTween(curve: Curves.easeInOutQuad)),
        weight: 52,
      ),
    ]).animate(_heartbeatController);

    // 2. Expanding radar / sonar ripple waves
    _rippleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();

    _initializeApp();
  }

  @override
  void dispose() {
    _heartbeatController.dispose();
    _rippleController.dispose();
    super.dispose();
  }

  Future<void> _initializeApp() async {
    final startTime = DateTime.now();

    // Check storage & user session
    await StorageService.isLoggedIn();
    await StorageService.getActiveCase();

    // Display splash for 2000ms so the user experiences the beautiful pulse
    final elapsed = DateTime.now().difference(startTime).inMilliseconds;
    if (elapsed < 2000) {
      await Future.delayed(Duration(milliseconds: 2000 - elapsed));
    }

    if (mounted) {
      Navigator.pushReplacement(
        context,
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) =>
              const SplashWelcomeScreen(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
          transitionDuration: const Duration(milliseconds: 400),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        alignment: Alignment.center,
        children: [
          // Background subtle radial ambient tint
          Container(
            decoration: const BoxDecoration(
              gradient: RadialGradient(
                center: Alignment.center,
                radius: 0.85,
                colors: [
                  Color(0xFFEFF6FF), // soft blue tint in center
                  Colors.white,
                ],
              ),
            ),
          ),

          // Expanding radar pulse rings
          AnimatedBuilder(
            animation: _rippleController,
            builder: (context, child) {
              final val = _rippleController.value;
              return Stack(
                alignment: Alignment.center,
                children: [
                  _buildRipple(val, 280),
                  _buildRipple((val + 0.5) % 1.0, 220),
                ],
              );
            },
          ),

          // Central Heartbeat Pulse Logo (Mark ONLY, No Writing)
          Center(
            child: AnimatedBuilder(
              animation: _heartbeatController,
              builder: (context, child) {
                return Transform.scale(
                  scale: _scaleAnimation.value,
                  child: Container(
                    width: 170,
                    height: 170,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF0052FF).withOpacity(0.18),
                          blurRadius: 36,
                          spreadRadius: 8,
                        ),
                      ],
                    ),
                    child: Center(
                      child: Image.asset(
                        'assets/images/aerva_mark.png',
                        width: 140,
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // Bottom pulse pill indicator (No text)
          Positioned(
            bottom: 50,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(3, (index) {
                return AnimatedBuilder(
                  animation: _heartbeatController,
                  builder: (context, child) {
                    final delay = index * 0.25;
                    final active = ((_heartbeatController.value + delay) % 1.0) < 0.4;
                    return Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: active ? 16 : 8,
                      height: 5,
                      decoration: BoxDecoration(
                        color: active
                            ? const Color(0xFF0052FF)
                            : const Color(0xFFCBD5E1),
                        borderRadius: BorderRadius.circular(3),
                      ),
                    );
                  },
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRipple(double value, double maxRadius) {
    final size = maxRadius * value;
    final opacity = ((1.0 - value) * 0.25).clamp(0.0, 1.0);
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: const Color(0xFF0052FF).withOpacity(opacity),
          width: 1.5,
        ),
      ),
    );
  }
}
