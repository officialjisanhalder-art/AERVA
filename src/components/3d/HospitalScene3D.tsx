"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

function HospitalTower() {
  const groupRef = useRef<THREE.Group>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.18;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.08 - 1;
    if (ring1.current) ring1.current.rotation.z += delta * 0.5;
    if (ring2.current) ring2.current.rotation.x -= delta * 0.35;
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Base platform */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[2, 2, 0.12, 48]} />
        <meshStandardMaterial color="#EEF3FF" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[1.8, 1.8, 0.02, 48]} />
        <meshStandardMaterial color="#0052FF" emissive="#0052FF" emissiveIntensity={0.8} />
      </mesh>

      {/* Main tower */}
      <RoundedBox args={[1.8, 3.6, 1.8]} radius={0.12} smoothness={4} position={[0, 2.0, 0]} castShadow>
        <meshPhysicalMaterial
          color="#ddeeff"
          transmission={0.85}
          roughness={0.05}
          metalness={0.1}
          ior={1.4}
          thickness={0.4}
        />
      </RoundedBox>

      {/* Window grid */}
      {Array.from({ length: 4 }).map((_, row) =>
        Array.from({ length: 3 }).map((_, col) => (
          <mesh key={`w${row}-${col}`} position={[-0.55 + col * 0.55, 0.8 + row * 0.72, 0.91]}>
            <planeGeometry args={[0.32, 0.4]} />
            <meshBasicMaterial color={row * col % 3 === 0 ? "#B8CCFF" : "#D8E8FF"} transparent opacity={0.7} />
          </mesh>
        ))
      )}

      {/* Side wing */}
      <RoundedBox args={[1.1, 2.0, 1.1]} radius={0.1} smoothness={4} position={[1.35, 1.1, 0.25]} castShadow>
        <meshStandardMaterial color="#F0F5FF" roughness={0.1} metalness={0.15} />
      </RoundedBox>

      {/* Glowing cross */}
      <group position={[0, 4.05, 0]}>
        <mesh>
          <boxGeometry args={[0.7, 0.18, 0.12]} />
          <meshStandardMaterial color="#0052FF" emissive="#0052FF" emissiveIntensity={3} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.18, 0.7, 0.12]} />
          <meshStandardMaterial color="#0052FF" emissive="#0052FF" emissiveIntensity={3} />
        </mesh>
        <pointLight color="#0052FF" intensity={4} distance={3} />
      </group>

      {/* Orbit rings */}
      <mesh ref={ring1} position={[0, 2, 0]} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.5, 0.018, 16, 80]} />
        <meshBasicMaterial color="#0052FF" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring2} position={[0, 2, 0]} rotation={[Math.PI / 6, Math.PI / 4, 0]}>
        <torusGeometry args={[2.0, 0.012, 16, 80]} />
        <meshBasicMaterial color="#10B981" transparent opacity={0.25} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

export default function HospitalScene3D() {
  return (
    <Canvas
      gl={{ alpha: true }}
      shadows
      camera={{ position: [5, 5, 6], fov: 38 }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[8, 12, 5]} intensity={2} castShadow shadow-mapSize={1024} />
      <pointLight position={[-4, 8, 4]} intensity={1.5} color="#0052FF" />
      <Environment preset="city" />
      <Float speed={1.5} floatIntensity={0.3} rotationIntensity={0.05}>
        <HospitalTower />
      </Float>
      <ContactShadows position={[0, -2.5, 0]} opacity={0.2} scale={14} blur={2} far={5} />
    </Canvas>
  );
}
