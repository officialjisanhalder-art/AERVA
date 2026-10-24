"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function Particles() {
  const count = 120;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() =>
    Array.from({ length: count }).map(() => ({
      angle: Math.random() * Math.PI * 2,
      radius: 1.8 + Math.random() * 3.5,
      speed: 0.6 + Math.random() * 0.7,
      y: (Math.random() - 0.5) * 2.5,
      size: 0.02 + Math.random() * 0.025,
    })), []);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    particles.forEach((p, i) => {
      p.radius -= p.speed * delta;
      if (p.radius < 1.2) p.radius = 5.5;
      dummy.position.set(Math.cos(p.angle) * p.radius, p.y, Math.sin(p.angle) * p.radius);
      dummy.scale.setScalar(p.size);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#00B2FF" transparent opacity={0.75} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}

function EngineOrb() {
  const orbRef = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (orbRef.current) {
      orbRef.current.rotation.y += delta * 0.5;
      const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.025;
      orbRef.current.scale.set(s, s, s);
    }
    if (ring1.current) ring1.current.rotation.z += delta * 0.4;
    if (ring2.current) ring2.current.rotation.x -= delta * 0.3;
  });

  return (
    <Float speed={1.5} floatIntensity={0.4} rotationIntensity={0.2}>
      <group>
        <mesh ref={ring1} rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[2, 0.015, 16, 128]} />
          <meshBasicMaterial color="#0052FF" transparent opacity={0.25} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh ref={ring2} rotation={[Math.PI / 6, Math.PI / 3, 0]}>
          <torusGeometry args={[1.65, 0.01, 16, 128]} />
          <meshBasicMaterial color="#00B2FF" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
        </mesh>

        <mesh ref={orbRef}>
          <Sphere args={[1.1, 128, 128]}>
            <MeshDistortMaterial
              color="#0044EE"
              emissive="#00B2FF"
              emissiveIntensity={0.5}
              roughness={0.05}
              metalness={0.9}
              clearcoat={1}
              clearcoatRoughness={0.05}
              distort={0.25}
              speed={2.5}
            />
          </Sphere>
        </mesh>

        {/* Outer glow sphere */}
        <mesh>
          <sphereGeometry args={[1.4, 32, 32]} />
          <meshBasicMaterial color="#0052FF" transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
        </mesh>

        <Html center zIndexRange={[100, 0]}>
          <div className="flex flex-col items-center text-center pointer-events-none select-none">
            <span className="text-white font-black text-sm tracking-[0.15em] drop-shadow-lg">AERVA</span>
            <span className="text-[#00B2FF] text-[9px] uppercase tracking-[0.2em] font-semibold">Decision Engine</span>
          </div>
        </Html>
      </group>
    </Float>
  );
}

import { Activity, Clock, Droplet, Users, ShieldCheck, Stethoscope } from "lucide-react";

const factors = [
  { id: "type", icon: Activity, title: "Emergency Type", items: ["Cardiac", "Trauma", "Stroke", "Others"], color: "#0052FF" },
  { id: "capability", icon: Stethoscope, title: "Hospital Capability", items: ["Specialists", "Equipment", "Departments"], color: "#7C3AED" },
  { id: "capacity", icon: Users, title: "Live Capacity", items: ["ER Status", "ICU Beds", "Ventilators"], color: "#0891B2" },
  { id: "time", icon: Clock, title: "Travel Time", items: ["Real-Time Traffic", "Distance", "Road Conditions"], color: "#D97706" },
  { id: "blood", icon: Droplet, title: "Blood Availability", items: ["Required Group", "Live Inventory"], color: "#DC2626" },
  { id: "freshness", icon: ShieldCheck, title: "Data Freshness", items: ["Verified Info", "Up-to-date"], color: "#059669" },
];

function OrbitRings() {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {[3.5, 4.8, 6.1].map((r, i) => (
        <mesh key={r}>
          <ringGeometry args={[r - 0.015, r + 0.015, 64]} />
          <meshBasicMaterial color={i === 1 ? "#00B2FF" : "#0052FF"} transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function OrbitingCards() {
  const cardsRef = useRef<THREE.Group[]>([]);
  
  useFrame((_, delta) => {
    // Make them orbit independently at different speeds based on their distance
    cardsRef.current.forEach((card, i) => {
      if (card) {
        const speed = 0.15 - (Math.floor(i / 2) * 0.03); // Further orbits = slower
        card.rotation.y += delta * speed;
      }
    });
  });

  return (
    <group>
      <OrbitRings />
      {factors.map((f, i) => {
        // Place 2 cards on each of the 3 orbits
        const orbitIndex = Math.floor(i / 2);
        const radii = [3.5, 4.8, 6.1];
        const radius = radii[orbitIndex];
        
        // Offset angle so they start spread out
        const angle = (i % 2) * Math.PI + (orbitIndex * Math.PI / 4);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        // Slight undulation based on orbit
        const y = Math.sin(angle * 2) * 0.3;
        
        const Icon = f.icon;
        
        return (
          <group 
            key={f.id} 
            ref={(el) => { if (el) cardsRef.current[i] = el; }}
          >
            <group position={[x, y, z]}>
              <Html transform sprite center distanceFactor={5} zIndexRange={[100, 0]}>
                <div 
                  className="w-52 bg-[#050B18]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all cursor-pointer"
                  style={{
                    boxShadow: `0 10px 30px -10px ${f.color}40`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: f.color + "22" }}>
                      <Icon className="w-4 h-4" style={{ color: f.color }} />
                    </div>
                    <span className="font-bold text-white text-xs">{f.title}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {f.items.map(item => (
                      <span key={item} className="text-[10px] text-gray-400 bg-white/5 px-2 py-1 rounded-full border border-white/5 whitespace-nowrap">{item}</span>
                    ))}
                  </div>
                </div>
              </Html>
            </group>
          </group>
        );
      })}
    </group>
  );
}

export default function OrbScene() {
  return (
    <Canvas
      gl={{ alpha: true }}
      camera={{ position: [0, 4, 25], fov: 16 }}
      style={{ background: "transparent", width: "100%", height: "100%", cursor: "grab" }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={2} color="#0052FF" />
      <pointLight position={[-5, -5, 5]} intensity={1} color="#00B2FF" />
      
      <EngineOrb />
      <Particles />
      <OrbitingCards />
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        autoRotate 
        autoRotateSpeed={0.8}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.5}
      />
    </Canvas>
  );
}
