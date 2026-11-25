import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '../ui/cn';

class SceneErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const FORMATION_NODES: Array<{
  id: string;
  label: string;
  pos: [number, number, number];
  highlight?: boolean;
}> = [
  { id: 'GK', label: 'GK', pos: [0, 0.12, 4.1] },
  { id: 'LB', label: 'LB', pos: [-2.1, 0.12, 2.5] },
  { id: 'LCB', label: 'CB', pos: [-0.85, 0.12, 2.75] },
  { id: 'RCB', label: 'CB', pos: [0.85, 0.12, 2.75] },
  { id: 'RB', label: 'RB', pos: [2.1, 0.12, 2.5] },
  { id: 'CDM', label: 'CDM', pos: [0, 0.14, 1.1] },
  { id: 'CM', label: 'CM · 87%', pos: [-1.15, 0.22, -0.15], highlight: true },
  { id: 'RCM', label: 'CM', pos: [1.15, 0.14, -0.15] },
  { id: 'LW', label: 'LW', pos: [-2.05, 0.14, -2.1] },
  { id: 'ST', label: 'ST', pos: [0, 0.16, -2.85] },
  { id: 'RW', label: 'RW', pos: [2.05, 0.14, -2.1] },
];

function PitchMarkings() {
  const halfW = 3.1;
  const halfL = 4.6;
  const boxW = 1.65;
  const boxL = 1.45;
  const sixW = 0.85;
  const sixL = 0.55;

  const circlePts = useMemo(() => {
    const pts: Array<[number, number, number]> = [];
    for (let i = 0; i <= 48; i += 1) {
      const a = (i / 48) * Math.PI * 2;
      pts.push([Math.cos(a) * 0.85, 0.025, Math.sin(a) * 0.85]);
    }
    return pts;
  }, []);

  const lineColor = '#cbd5e1';

  return (
    <group>
      {/* Outer touchline & goal lines */}
      <Line
        points={[
          [-halfW, 0.025, -halfL],
          [halfW, 0.025, -halfL],
          [halfW, 0.025, halfL],
          [-halfW, 0.025, halfL],
          [-halfW, 0.025, -halfL],
        ]}
        color={lineColor}
        lineWidth={1.3}
        transparent
        opacity={0.75}
      />
      {/* Halfway line */}
      <Line
        points={[
          [-halfW, 0.025, 0],
          [halfW, 0.025, 0],
        ]}
        color={lineColor}
        lineWidth={1.2}
        transparent
        opacity={0.7}
      />
      {/* Center circle */}
      <Line points={circlePts} color={lineColor} lineWidth={1.2} transparent opacity={0.7} />

      {/* Top & bottom 18-yard boxes */}
      {[-1, 1].map((dir) => (
        <group key={dir}>
          <Line
            points={[
              [-boxW, 0.025, dir * halfL],
              [-boxW, 0.025, dir * (halfL - boxL)],
              [boxW, 0.025, dir * (halfL - boxL)],
              [boxW, 0.025, dir * halfL],
            ]}
            color={lineColor}
            lineWidth={1.1}
            transparent
            opacity={0.65}
          />
          <Line
            points={[
              [-sixW, 0.025, dir * halfL],
              [-sixW, 0.025, dir * (halfL - sixL)],
              [sixW, 0.025, dir * (halfL - sixL)],
              [sixW, 0.025, dir * halfL],
            ]}
            color={lineColor}
            lineWidth={1}
            transparent
            opacity={0.55}
          />
          {/* 3D Goalposts */}
          <Line
            points={[
              [-0.45, 0.02, dir * halfL],
              [-0.45, 0.34, dir * halfL],
              [0.45, 0.34, dir * halfL],
              [0.45, 0.02, dir * halfL],
            ]}
            color="#f8fafc"
            lineWidth={2}
          />
        </group>
      ))}
    </group>
  );
}

function TacticalNodes({ reduced }: { reduced: boolean }) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const ballRef = useRef<THREE.Mesh>(null);

  const arcA = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-1.15, 0.22, -0.15),
      new THREE.Vector3(-0.6, 0.95, -1.5),
      new THREE.Vector3(0, 0.16, -2.85),
    );
    return curve.getPoints(32).map((p) => [p.x, p.y, p.z] as [number, number, number]);
  }, []);

  const arcB = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0.14, 1.1),
      new THREE.Vector3(-0.65, 0.65, 0.45),
      new THREE.Vector3(-1.15, 0.22, -0.15),
    );
    return curve.getPoints(28).map((p) => [p.x, p.y, p.z] as [number, number, number]);
  }, []);

  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.getElapsedTime();
    if (pulseRef.current) {
      const s = 1 + Math.sin(t * 2.4) * 0.18;
      pulseRef.current.scale.set(s, s, 1);
    }
    if (ballRef.current) {
      const p = (t * 0.32) % 1;
      const idx = Math.min(arcA.length - 1, Math.floor(p * (arcA.length - 1)));
      const pt = arcA[idx];
      ballRef.current.position.set(pt[0], pt[1], pt[2]);
    }
  });

  return (
    <group>
      {/* Tactical pass links */}
      <Line points={arcA} color="#b6ff1a" lineWidth={1.6} transparent opacity={0.85} />
      <Line points={arcB} color="#34d399" lineWidth={1.2} transparent opacity={0.55} />

      {/* Travelling signal node */}
      <mesh ref={ballRef} position={[-1.15, 0.22, -0.15]}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshStandardMaterial color="#b6ff1a" emissive="#b6ff1a" emissiveIntensity={1.6} />
      </mesh>

      {FORMATION_NODES.map((node) => (
        <group key={node.id} position={node.pos}>
          {node.highlight ? (
            <>
              <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.14, 0]}>
                <ringGeometry args={[0.24, 0.32, 32]} />
                <meshBasicMaterial color="#b6ff1a" transparent opacity={0.75} side={THREE.DoubleSide} />
              </mesh>
              <mesh>
                <cylinderGeometry args={[0.14, 0.14, 0.24, 24]} />
                <meshStandardMaterial color="#b6ff1a" emissive="#b6ff1a" emissiveIntensity={0.65} roughness={0.3} />
              </mesh>
              <Html position={[0, 0.42, 0]} center distanceFactor={9}>
                <div className="pointer-events-none whitespace-nowrap rounded-md border border-brand/50 bg-ink-950/95 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-brand shadow-lg">
                  {node.label}
                </div>
              </Html>
            </>
          ) : (
            <mesh>
              <cylinderGeometry args={[0.1, 0.1, 0.12, 20]} />
              <meshStandardMaterial color="#1e293b" emissive="#38bdf8" emissiveIntensity={0.22} roughness={0.4} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

function PitchSlab({ reduced }: { reduced: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (reduced || !groupRef.current) return;
    groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.7) * 0.05;
  });

  return (
    <group ref={groupRef} rotation={[0.06, -0.32, 0]}>
      {/* Architectural pitch chassis */}
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <boxGeometry args={[6.8, 0.22, 9.8]} />
        <meshStandardMaterial color="#0b1320" metalness={0.45} roughness={0.55} />
      </mesh>

      {/* Grass surface */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[6.5, 0.03, 9.5]} />
        <meshStandardMaterial color="#0e3a25" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Mow stripes */}
      {Array.from({ length: 10 }).map((_, idx) => (
        <mesh key={idx} position={[0, 0.017, -4.275 + idx * 0.95]}>
          <planeGeometry args={[6.4, 0.47]} />
          <meshStandardMaterial
            color="#155336"
            transparent
            opacity={0.45}
            roughness={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      <PitchMarkings />
      <TacticalNodes reduced={reduced} />
    </group>
  );
}

function StaticFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden bg-ink-950',
        className,
      )}
    >
      <img
        src="/images/stadium-night.jpg"
        alt="Floodlit football stadium pitch"
        className="h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/35 to-ink-950/60" />
    </div>
  );
}

export function Hero3DPitchScene({ className }: { className?: string }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(q.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    q.addEventListener('change', onChange);
    return () => q.removeEventListener('change', onChange);
  }, []);

  return (
    <div className={cn('relative h-full w-full', className)} aria-label="Interactive 3D tactical pitch preview">
      <SceneErrorBoundary fallback={<StaticFallback />}>
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-ink-950 text-[11px] font-mono uppercase tracking-widest text-slate-500">
              Initialising 3D pitch…
            </div>
          }
        >
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [5.4, 4.9, 6.2], fov: 38, near: 0.1, far: 50 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            fallback={<StaticFallback />}
          >
            <ambientLight intensity={0.75} />
            <directionalLight position={[6, 10, 6]} intensity={1.35} color="#f8fafc" />
            <pointLight position={[-4, 4, -3]} intensity={1.1} color="#b6ff1a" distance={14} />
            <pointLight position={[4, 3, 4]} intensity={0.8} color="#34d399" distance={12} />

            <PitchSlab reduced={reduced} />

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate={!reduced}
              autoRotateSpeed={0.55}
              minPolarAngle={Math.PI / 5}
              maxPolarAngle={Math.PI / 2.25}
            />
          </Canvas>
        </Suspense>
      </SceneErrorBoundary>
    </div>
  );
}
