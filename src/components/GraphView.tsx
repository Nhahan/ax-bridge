import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface FadeInMaterial {
  opacity: number;
  transparent: boolean;
}

interface NodeProps {
  position: THREE.Vector3;
  text: string;
  isCenter?: boolean;
  onPointerOver: (event: ThreeEvent<PointerEvent>, text: string, isCenter: boolean, position: THREE.Vector3) => void;
  onPointerOut: (event: ThreeEvent<PointerEvent>) => void;
}

function Node({ position, text, isCenter = false, onPointerOver, onPointerOut }: NodeProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.MeshStandardMaterial & FadeInMaterial>(null!);
  const [hovered, setHovered] = useState(false);
  const fadeInComplete = useRef(false);
  const baseScale = isCenter ? 1.8 : 1;
  const nodeRadius = isCenter ? 0.08 : 0.06;
  const baseOpacity = isCenter ? 0.9 : 0.75;
  const baseColor = isCenter ? '#BF3BDE' : '#8888ff';
  const centerBaseEmissiveIntensity = 0.6;
  const nonCenterBaseEmissiveIntensity = 0.25;

  useEffect(() => {
      if (materialRef.current) {
          materialRef.current.opacity = 0;
          materialRef.current.transparent = true;
          materialRef.current.emissiveIntensity = isCenter ? centerBaseEmissiveIntensity : nonCenterBaseEmissiveIntensity;
          materialRef.current.color.set(baseColor);
          materialRef.current.emissive.set(baseColor);
      }
  }, [isCenter, baseColor]);

  useFrame((_, delta) => {
    if (!fadeInComplete.current && materialRef.current) {
      materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, baseOpacity, delta * 2);
      if (Math.abs(materialRef.current.opacity - baseOpacity) < 0.01) {
        materialRef.current.opacity = baseOpacity;
        fadeInComplete.current = true;
      }
    }

    if (fadeInComplete.current && materialRef.current) {
        const targetOpacity = isCenter ? 0.9 : (hovered ? 1.0 : 0.75);
        materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, delta * 10);

        if (isCenter) {
            const targetEmissiveIntensity = hovered ? 1.1 : centerBaseEmissiveIntensity;
            materialRef.current.emissive.lerp(new THREE.Color(baseColor), delta * 8);
            materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(materialRef.current.emissiveIntensity, targetEmissiveIntensity, delta * 10);
        } else {
            const targetEmissiveIntensity = nonCenterBaseEmissiveIntensity;
            materialRef.current.color.lerp(new THREE.Color(baseColor), delta * 8);
            materialRef.current.emissive.lerp(new THREE.Color(baseColor), delta * 8);
            materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(materialRef.current.emissiveIntensity, targetEmissiveIntensity, delta * 10);
        }
    }
    
    if (ref.current) {
      const targetScale = hovered ? baseScale * 1.7 : baseScale;
      const currentScale = ref.current.scale.x;
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 8);
      ref.current.scale.set(newScale, newScale, newScale);
    }
  });

  return (
    <mesh
      ref={ref}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onPointerOver(e, text, !!isCenter, position);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        onPointerOut(e);
      }}
    >
      <sphereGeometry args={[nodeRadius, 24, 24]} />
      <meshStandardMaterial 
        ref={materialRef}
        emissiveIntensity={isCenter ? centerBaseEmissiveIntensity : nonCenterBaseEmissiveIntensity}
        roughness={0.4}
        metalness={0.3}
        toneMapped={false}
        transparent={true}
        opacity={0} 
      />
    </mesh>
  );
}

interface EdgeProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
}

function Edge({ start, end }: EdgeProps) {
  const points = useMemo(() => [start, end], [start, end]);
  const [currentOpacity, setCurrentOpacity] = useState(0);
  const targetBaseOpacity = 0.08;

  useFrame((_, delta) => {
      setCurrentOpacity((prev) => Math.min(prev + delta * 1.5, targetBaseOpacity));
  });

  return (
    <Line
      points={points}
      color="#ffffff"
      lineWidth={0.5}
      transparent={true}
      opacity={currentOpacity}
      renderOrder={1}
    />
  );
}

interface ParticleProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  delay: number;
}

function MovingParticle({ start, end, delay }: ParticleProps) {
  const particleRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.MeshBasicMaterial & FadeInMaterial>(null!);
  const [progress, setProgress] = useState(-delay * 0.3);
  const speed = 0.1 + Math.random() * 0.1;
  const targetBaseOpacity = 0.5;

  useFrame((_, delta) => {
    if (materialRef.current) {
        materialRef.current.opacity = Math.min(materialRef.current.opacity + delta * 2, targetBaseOpacity);
    }
    
    let newProgress = progress + delta * speed;
    if (newProgress > 1) {
      newProgress = -delay * 0.3; 
    }
    setProgress(newProgress);

    if (particleRef.current) {
      const isVisible = newProgress >= 0 && newProgress <= 1;
      particleRef.current.visible = isVisible;
      if (isVisible) {
        particleRef.current.position.lerpVectors(start, end, newProgress);
      }
    }
  });

  return (
    <mesh ref={particleRef} visible={false}> 
      <sphereGeometry args={[0.025, 8, 8]} />
      <meshBasicMaterial ref={materialRef} color="#ADD8E6" toneMapped={false} transparent opacity={0} /> 
    </mesh>
  );
}

interface ScreenPositionUpdaterProps {
  trackPosition: THREE.Vector3 | null;
  yOffset?: number;
  onUpdatePosition: (screenPos: { x: number; y: number } | null) => void;
}

function ScreenPositionUpdater({ trackPosition, yOffset = 0, onUpdatePosition }: ScreenPositionUpdaterProps) {
  const { camera, size } = useThree();

  useFrame(() => {
    if (trackPosition) {
      const position3D = trackPosition.clone();
      position3D.y += yOffset;
      position3D.project(camera);
      
      const x = (position3D.x * size.width) / 2;
      const y = -(position3D.y * size.height) / 2;
      onUpdatePosition({ x, y });
    } else {
      onUpdatePosition(null);
    }
  });

  return null;
}

interface GraphNode {
  id: string;
  text: string;
  position: THREE.Vector3;
  isCenter: boolean;
}

interface GraphEdge {
  start: THREE.Vector3;
  end: THREE.Vector3;
}

interface GraphRendererProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  handlePointerOver: (event: ThreeEvent<PointerEvent>, text: string, isCenter: boolean, position: THREE.Vector3) => void;
  handlePointerOut: (event: ThreeEvent<PointerEvent>) => void;
  hoveredText: string | null;
  hoveredNodeIsCenter: boolean;
  textPosition: THREE.Vector3;
  centerNodeTrackPosition: THREE.Vector3 | null;
  onUpdateCenterScreenPos: (screenPos: { x: number; y: number } | null) => void;
  isInteracting: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}

const PRELOAD_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?!@#$%^&*()_-+=";

function GraphRenderer({ 
  nodes, edges, handlePointerOver, handlePointerOut, 
  hoveredText, hoveredNodeIsCenter, 
  textPosition,
  centerNodeTrackPosition,
  onUpdateCenterScreenPos,
  isInteracting, controlsRef
}: GraphRendererProps) {

  return (
    <>
      <ScreenPositionUpdater 
        trackPosition={centerNodeTrackPosition} 
        yOffset={0.6}
        onUpdatePosition={onUpdateCenterScreenPos} 
      />

      <Text visible={false} fontSize={0.01}>{PRELOAD_CHARS}</Text>
      
      <ambientLight intensity={0.05} /> 
      <directionalLight position={[5, 10, -5]} intensity={0.2} color="#88aaff" />
      <pointLight position={[-10, -10, -10]} intensity={1.5} color="#4ecdc4" distance={45} decay={2} /> 
      <pointLight position={[10, 10, 10]} intensity={1.0} color="#00c0f0" distance={40} decay={1.8} />
      <fog attach="fog" args={['#000000', 17, 38]} /> 
      
      {nodes.map((node) => (
        <Node
          key={node.id}
          position={node.position}
          text={node.text}
          isCenter={node.isCenter}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
      ))}
      {edges.map((edge, i) => (
        <Edge key={`edge-${i}`} start={edge.start} end={edge.end} />
      ))}
      {edges.map((edge, i) => (
        <MovingParticle 
            key={`particle-${i}`} 
            start={edge.start} 
            end={edge.end} 
            delay={Math.random() * 5} 
        /> 
      ))}
      
      {hoveredText && !hoveredNodeIsCenter && (
        <Billboard 
          position={textPosition}
          follow={true} 
          lockX={false} 
          lockY={false} 
          lockZ={false}
          renderOrder={998} 
        > 
          <Text
            color="#BF3BDE"
            fontSize={0.26}
            maxWidth={1.6}
            fontWeight={'normal'}
            fillOpacity={1}
            outlineOpacity={1}
            lineHeight={1.2}
            letterSpacing={0.02}
            textAlign="center"
            whiteSpace="nowrap"
            anchorX="center"
            anchorY="middle"
            outlineColor="#000000"
            outlineWidth={0.012}
            renderOrder={999} 
            material-depthTest={false} 
          >
            {hoveredText}
          </Text>
        </Billboard>
      )}

      <OrbitControls 
        ref={controlsRef}
        enableZoom={false}
        enablePan={true} 
        enableRotate={true} 
        autoRotate={!isInteracting}
        autoRotateSpeed={0.15}
        minDistance={5}
        maxDistance={25} 
        enableDamping={true}
        dampingFactor={0.1}
      />
    </>
  );
}

interface GraphProps {
  nodesData?: { id: string; text: string }[];
}

const aiKeywords = [
  "AI Integration", "Machine Learning", "Deep Reality", "Neural Synthesis", "NLP Bridge", 
  "Computer Vision", "Robotic Process", "Data Automation", "Cloud Convergence", "Quantum Leap", 
  "Cyber Resilience", "Decentralized Trust", "Connected Devices", "Next-Gen Comms", "Immersive VR", "AR Overlay", 
  "Cognitive Singularity", "Human Enhancement", "Bio-Digital Fusion", "Nano Structures", "Exoplanetary AI", "Sustainable Tech",
  "Predictive Models", "Contextual AI", "Strategic Planning", "Generative Design", "Simulated Worlds", "Explainable AI",
  "Autonomous Systems", "Collective Intelligence", "Embodied Cognition", "Digital Twins", "Reality Mesh", "Future Interfaces",
  "Ethical AI", "AI Governance", "Human-AI Collab", "Sentient Code?", "AGI Pathways", "Conscious Machines"
];

export default function GraphView({ nodesData }: GraphProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [hoveredText, setHoveredText] = useState<string | null>(null);
  const [hoveredNodeIsCenter, setHoveredNodeIsCenter] = useState(false);
  const [billboardTextPosition, setBillboardTextPosition] = useState<THREE.Vector3>(new THREE.Vector3());
  const [centerNodeWorldPos, setCenterNodeWorldPos] = useState<THREE.Vector3 | null>(null);
  const [centerTextScreenPos, setCenterTextScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [showCenterTextOverlay, setShowCenterTextOverlay] = useState(false); 
  const [shouldRenderGraph, setShouldRenderGraph] = useState(false);

  const displayNodesData = useMemo(() => {
    if (nodesData && nodesData.length > 0) {
      return nodesData;
    } else {
      const shuffled = [...aiKeywords].sort(() => 0.5 - Math.random());
      const nodeCount = 50;
      return [{ id: 'center-node', text: 'Axistant Nexus' }, ...shuffled.slice(0, nodeCount).map((text, i) => ({ id: `node-${i}`, text }))];
    }
  }, [nodesData]);

  const nodes = useMemo(() => {
    const centerNode = { ...displayNodesData[0], position: new THREE.Vector3(0, 0, 0), isCenter: true };
    const outerNodes = displayNodesData.slice(1).map((node, i) => {
      const count = displayNodesData.length - 1;
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const radius = 7;
      const position = new THREE.Vector3();
      position.setFromSphericalCoords(radius, phi, theta);
      return { ...node, position, isCenter: false };
    });
    return [centerNode, ...outerNodes];
  }, [displayNodesData]);

  const edges = useMemo(() => {
    if (nodes.length < 2) return [];
    const centerPosition = nodes[0].position;
    return nodes.slice(1).map((node) => ({ start: centerPosition, end: node.position }));
  }, [nodes]);

  const handlePointerOver = (event: ThreeEvent<PointerEvent>, text: string, isCenter: boolean, position: THREE.Vector3) => {
    setIsInteracting(true);
    setHoveredText(text);
    setHoveredNodeIsCenter(isCenter);
    document.body.style.cursor = 'pointer';

    if (isCenter) {
      setCenterNodeWorldPos(position);
      setShowCenterTextOverlay(true);
      setBillboardTextPosition(new THREE.Vector3());
    } else {
      const yOffset = 0.3;
      setBillboardTextPosition(position.clone().add(new THREE.Vector3(0, yOffset, 0)));
      setShowCenterTextOverlay(false);
      setCenterNodeWorldPos(null);
    }
  };

  const handlePointerOut = () => {
    setIsInteracting(false);
    setHoveredText(null);
    setHoveredNodeIsCenter(false);
    setShowCenterTextOverlay(false);
    setCenterNodeWorldPos(null);
    document.body.style.cursor = 'default';
  };

  const handleUpdateCenterScreenPos = useCallback((screenPos: { x: number; y: number } | null) => {
    setCenterTextScreenPos(screenPos);
  }, []);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !isInteracting;
    }
  }, [isInteracting]);

  useEffect(() => {
      const timer = setTimeout(() => setShouldRenderGraph(true), 100);
      return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}> 
      <Canvas 
        camera={{ position: [0, 0, 14], fov: 70 }}
        style={{ background: 'radial-gradient(circle, #0b132b, #000000)', display: 'block' }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => gl.setPixelRatio(window.devicePixelRatio || 1)}
      >
        {shouldRenderGraph && (
          <GraphRenderer 
            nodes={nodes}
            edges={edges}
            handlePointerOver={handlePointerOver}
            handlePointerOut={handlePointerOut}
            hoveredText={hoveredText}
            hoveredNodeIsCenter={hoveredNodeIsCenter}
            textPosition={billboardTextPosition}
            centerNodeTrackPosition={centerNodeWorldPos}
            onUpdateCenterScreenPos={handleUpdateCenterScreenPos}
            isInteracting={isInteracting}
            controlsRef={controlsRef}
          />
        )}
      </Canvas>
      {showCenterTextOverlay && centerTextScreenPos && hoveredText && (
        <div 
          style={{
            position: 'absolute',
            left: `calc(50% + ${centerTextScreenPos.x}px)`,
            top: `calc(50% + ${centerTextScreenPos.y}px)`,
            transform: 'translate(-50%, -50%)',
            color: '#BF3BDE',
            fontWeight: 'bold',
            fontSize: '16px',
            padding: '4px 8px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            pointerEvents: 'none',
            opacity: 0.9,
            transition: 'opacity 0.2s ease-in-out'
          }}
        >
          {hoveredText} 
        </div>
      )}
    </div>
  );
} 