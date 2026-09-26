"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Html,
  Environment,
  ContactShadows,
  Float,
  Line,
  MeshDistortMaterial,
  Sphere,
  OrthographicCamera,
} from "@react-three/drei";
import * as THREE from "three";
import { CheckCircle2 } from "lucide-react";

/* ─── Route curve ─────────────────────────────────────────────────── */
const route = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-3.2, 0.05, 2.8),
  new THREE.Vector3(-3.2, 0.05, 0),
  new THREE.Vector3(-1, 0.05, 0),
  new THREE.Vector3(-1, 0.05, -1.5),
  new THREE.Vector3(1.5, 0.05, -1.5),
  new THREE.Vector3(1.5, 0.05, -2.8),
  new THREE.Vector3(2.8, 0.05, -2.8),
]);

/* ─── Building ────────────────────────────────────────────────────── */
function Building({
  position,
  size,
  color = "#ffffff",
  isHospital = false,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  isHospital?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (isHospital && meshRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.012;
      meshRef.current.scale.set(pulse, 1, pulse);
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={isHospital ? "#ffffff" : color}
          roughness={isHospital ? 0.05 : 0.15}
          metalness={isHospital ? 0.3 : 0.1}
          emissive={isHospital ? "#0052FF" : "#000000"}
          emissiveIntensity={isHospital ? 0.04 : 0}
        />
      </mesh>

      {/* Windows */}
      {!isHospital &&
        Array.from({ length: Math.floor(size[1] * 2) }).map((_, r) =>
          Array.from({ length: 2 }).map((_, c) => (
            <mesh
              key={`w-${r}-${c}`}
              position={[
                -size[0] / 4 + c * (size[0] / 2),
                0.3 + r * 0.4,
                size[2] / 2 + 0.01,
              ]}
            >
              <planeGeometry args={[0.15, 0.2]} />
              <meshBasicMaterial
                color={Math.random() > 0.35 ? "#c8d8ff" : "#ffffff"}
                transparent
                opacity={0.7}
              />
            </mesh>
          ))
        )}

      {/* Hospital cross */}
      {isHospital && (
        <group position={[0, size[1] + 0.35, 0]}>
          <mesh>
            <boxGeometry args={[0.55, 0.15, 0.12]} />
            <meshStandardMaterial
              color="#0052FF"
              emissive="#0052FF"
              emissiveIntensity={2}
            />
          </mesh>
          <mesh>
            <boxGeometry args={[0.15, 0.55, 0.12]} />
            <meshStandardMaterial
              color="#0052FF"
              emissive="#0052FF"
              emissiveIntensity={2}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

/* ─── City ────────────────────────────────────────────────────────── */
function City() {
  const buildings = useMemo(
    () => [
      // Hospital (main, highlighted)
      { pos: [2.8, 0, -2.8] as [number, number, number], size: [1.2, 2.8, 1.2] as [number, number, number], isHospital: true },
      // Background buildings
      { pos: [-4, 0, -3] as [number, number, number], size: [0.9, 2.2, 0.9] as [number, number, number], color: "#e8edf5" },
      { pos: [-2.5, 0, -3.5] as [number, number, number], size: [0.7, 1.6, 0.7] as [number, number, number], color: "#ecf0f8" },
      { pos: [0, 0, -4] as [number, number, number], size: [1, 3, 1] as [number, number, number], color: "#e4e9f2" },
      { pos: [1.5, 0, -4.5] as [number, number, number], size: [0.8, 2.5, 0.8] as [number, number, number], color: "#eaeff7" },
      { pos: [4, 0, -3.5] as [number, number, number], size: [0.9, 1.8, 0.9] as [number, number, number], color: "#e6ebf5" },
      { pos: [-4.5, 0, 0] as [number, number, number], size: [0.8, 1.4, 0.8] as [number, number, number], color: "#eef2f9" },
      { pos: [-4, 0, 2] as [number, number, number], size: [1, 1.8, 1] as [number, number, number], color: "#e9eef7" },
      { pos: [4, 0, 0] as [number, number, number], size: [0.7, 1.2, 0.7] as [number, number, number], color: "#f0f4fa" },
      { pos: [4.5, 0, 2.5] as [number, number, number], size: [0.9, 2, 0.9] as [number, number, number], color: "#ebf0f8" },
      { pos: [-1, 0, 3.5] as [number, number, number], size: [0.7, 1, 0.7] as [number, number, number], color: "#f2f5fb" },
      { pos: [1, 0, 4] as [number, number, number], size: [0.8, 1.3, 0.8] as [number, number, number], color: "#edf1f9" },
      { pos: [-3, 0, -1.5] as [number, number, number], size: [0.6, 1.1, 0.6] as [number, number, number], color: "#f0f3fa" },
      { pos: [3, 0, 1.5] as [number, number, number], size: [0.6, 0.9, 0.6] as [number, number, number], color: "#f3f6fb" },
    ],
    []
  );

  return (
    <>
      {buildings.map((b, i) => (
        <Building key={i} position={b.pos} size={b.size} color={b.color} isHospital={b.isHospital} />
      ))}
    </>
  );
}

/* ─── Glowing Route ───────────────────────────────────────────────── */
function GlowingRoute() {
  const points = useMemo(() => route.getPoints(80), []);
  return (
    <>
      {/* Glow (thick + transparent) */}
      <Line points={points} color="#0052FF" lineWidth={10} transparent opacity={0.12} />
      {/* Core */}
      <Line points={points} color="#0052FF" lineWidth={4} transparent opacity={0.9} />
    </>
  );
}

/* ─── Animated Ambulance ──────────────────────────────────────────── */
function Ambulance() {
  const groupRef = useRef<THREE.Group>(null);
  const tRef = useRef(0);
  const lightRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    tRef.current = (tRef.current + delta * 0.18) % 1;
    const pt = route.getPoint(tRef.current);
    const tan = route.getTangent(tRef.current);
    if (groupRef.current) {
      groupRef.current.position.set(pt.x, 0.18, pt.z);
      const target = pt.clone().add(tan);
      groupRef.current.lookAt(target.x, 0.18, target.z);
    }
    if (lightRef.current) {
      const pulse = Math.sin(Date.now() * 0.01) > 0 ? 1 : 0;
      (lightRef.current.material as THREE.MeshBasicMaterial).color.setHex(
        pulse ? 0xef4444 : 0x0052ff
      );
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[0.28, 0.18, 0.5]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.3} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.15, 0.08]} castShadow>
        <boxGeometry args={[0.26, 0.14, 0.28]} />
        <meshStandardMaterial color="#f0f4ff" roughness={0.1} metalness={0.2} />
      </mesh>
      {/* Red stripe */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.29, 0.05, 0.51]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      {/* Light */}
      <mesh ref={lightRef} position={[0, 0.21, 0.05]}>
        <boxGeometry args={[0.12, 0.05, 0.1]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

/* ─── User Pin ────────────────────────────────────────────────────── */
function UserPin() {
  return (
    <group position={[-3.2, 0, 2.8]}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.06, 32]} />
        <meshStandardMaterial color="#0A192F" roughness={0.2} />
      </mesh>
      <Html position={[0, 0.8, 0]} center zIndexRange={[100, 0]}>
        <div className="bg-[#0A192F] text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
          📍 You
        </div>
      </Html>
    </group>
  );
}

/* ─── Hospital Info Card ──────────────────────────────────────────── */
function HospitalCard() {
  return (
    <group position={[2.8, 0, -2.8]}>
      <Html position={[0, 4, 0]} center zIndexRange={[200, 0]}>
        <div
          className="w-56 rounded-2xl overflow-hidden shadow-2xl pointer-events-none"
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(0,82,255,0.15)",
          }}
        >
          <div className="bg-[#0052FF] px-4 py-2.5 flex items-center justify-between">
            <span className="text-white font-bold text-xs tracking-wide">✦ BEST MATCH</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-white/80 text-[10px]">Live</span>
            </div>
          </div>
          <div className="p-4">
            <p className="font-black text-[#0A192F] text-sm mb-0.5">Apollo City Hospital</p>
            <div className="flex gap-3 text-[#0052FF] font-bold text-xs mb-3">
              <span>8 min</span><span className="text-gray-300">·</span><span>1.8 km</span>
            </div>
            <div className="space-y-1.5">
              {["ER Available", "ICU Beds (4)", "Specialist On Duty"].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-[#10B981] flex-shrink-0" />
                  <span className="text-[11px] font-medium text-[#0A192F]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

/* ─── Camera ──────────────────────────────────────────────────────── */
function CameraRig() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  useFrame(() => {
    const tx = mouse.current.x * 0.6;
    const ty = 8 + mouse.current.y * 0.3;
    camera.position.x += (tx - camera.position.x) * 0.04;
    camera.position.y += (ty - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ─── Scene export ────────────────────────────────────────────────── */
export default function HeroScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 8, 8], fov: 40 }}
      className="w-full h-full"
      style={{ background: "transparent" }}
    >
      <color attach="background" args={["transparent"]} />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={40}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[2.8, 4, -2.8]} intensity={3} color="#0052FF" distance={6} />
      <pointLight position={[-3.2, 2, 2.8]} intensity={1} color="#00B2FF" distance={5} />

      <Environment preset="city" />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#EEF2F7" roughness={0.8} />
      </mesh>

      {/* Roads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[0.6, 20]} />
        <meshStandardMaterial color="#D8DDE8" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[20, 0.6]} />
        <meshStandardMaterial color="#D8DDE8" />
      </mesh>

      <City />
      <GlowingRoute />
      <Ambulance />
      <UserPin />
      <HospitalCard />

      <ContactShadows position={[0, 0.01, 0]} opacity={0.25} scale={16} blur={2} far={6} />

      <CameraRig />
    </Canvas>
  );
}
