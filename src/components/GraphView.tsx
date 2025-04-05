import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line, Html } from '@react-three/drei';
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
  const centerBaseColor = '#7C3AED';
  const nonCenterBaseColor = '#8888ff'; 
  const centerBaseEmissiveIntensity = 0.6; 
  const nonCenterBaseEmissiveIntensity = 0.25;

  // Glow size for the center node (adjust as needed)
  const glowSize = nodeRadius * 2.5; // Relative size for glow div

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.opacity = 0;
      materialRef.current.transparent = true;
      if (isCenter) {
        materialRef.current.emissiveIntensity = centerBaseEmissiveIntensity; 
        materialRef.current.color.set(centerBaseColor);
        materialRef.current.emissive.set(centerBaseColor);
      } else {
        materialRef.current.emissiveIntensity = nonCenterBaseEmissiveIntensity;
        materialRef.current.color.set(nonCenterBaseColor);
        materialRef.current.emissive.set(nonCenterBaseColor);
      }
    }
  }, [isCenter]); 

  useFrame((_, delta) => {
    if (!fadeInComplete.current && materialRef.current) {
      const currentBaseOpacity = isCenter ? baseOpacity : 0.75;
      materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, currentBaseOpacity, delta * 2);
      if (Math.abs(materialRef.current.opacity - currentBaseOpacity) < 0.01) {
        materialRef.current.opacity = currentBaseOpacity;
        fadeInComplete.current = true;
      }
    }

    if (fadeInComplete.current && materialRef.current) {
      const targetOpacity = isCenter ? baseOpacity : (hovered ? 1.0 : 0.75);
      materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, delta * 10);

      if (isCenter) {
        const targetEmissiveIntensity = hovered ? 1.1 : centerBaseEmissiveIntensity; 
        materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(materialRef.current.emissiveIntensity, targetEmissiveIntensity, delta * 10);
        materialRef.current.color.lerp(new THREE.Color(centerBaseColor), delta * 8);
        materialRef.current.emissive.lerp(new THREE.Color(centerBaseColor), delta * 8);
      } else {
        const targetEmissiveIntensity = nonCenterBaseEmissiveIntensity;
        materialRef.current.color.lerp(new THREE.Color(nonCenterBaseColor), delta * 8);
        materialRef.current.emissive.lerp(new THREE.Color(nonCenterBaseColor), delta * 8);
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
      renderOrder={isCenter ? 3 : 2}
    >
      <sphereGeometry args={[nodeRadius, 24, 24]} />
      <meshStandardMaterial 
        ref={materialRef}
        roughness={0.4}
        metalness={0.3}
        toneMapped={true}
        transparent={true}
        opacity={0} 
        depthTest={!isCenter}
      />
      {/* Conditionally render CSS glow for center node */} 
      {isCenter && (
        <Html
          as="div"
          center
          // Render between lines (1) and center node (3)
          zIndexRange={[1, 2]} 
          style={{ pointerEvents: 'none' }} 
        >
          <div
            style={{
              width: `${glowSize}rem`, // Use rem or other relative unit if preferred
              height: `${glowSize}rem`,
              borderRadius: '50%',
              animation: 'breathingGlow 3s ease-in-out infinite',
            }}
          />
        </Html>
      )}
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
  isCenter: boolean;
  onUpdatePosition: (screenPos: { x: number; y: number } | null) => void;
}

function ScreenPositionUpdater({ trackPosition, isCenter, onUpdatePosition }: ScreenPositionUpdaterProps) {
  const { camera, size } = useThree();
  const pixelOffsetY = isCenter ? -22 : -17;

  useFrame(() => {
    if (trackPosition) {
      const position3D = trackPosition.clone();
      position3D.project(camera);
      
      const x = (position3D.x * size.width) / 2;
      const y = -(position3D.y * size.height) / 2;
      onUpdatePosition({ x, y: y + pixelOffsetY });
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
  hoveredNodeIsCenter: boolean;
  hoveredNodeTrackPosition: THREE.Vector3 | null;
  onUpdateTextScreenPos: (screenPos: { x: number; y: number } | null) => void;
  isInteracting: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}

const PRELOAD_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?!@#$%^&*()_-+=";

function GraphRenderer({ 
  nodes, edges, handlePointerOver, handlePointerOut, 
  hoveredNodeIsCenter,
  hoveredNodeTrackPosition,
  onUpdateTextScreenPos,
  isInteracting, controlsRef
}: GraphRendererProps) {

  return (
    <>
      <ScreenPositionUpdater 
        trackPosition={hoveredNodeTrackPosition}
        isCenter={hoveredNodeIsCenter}
        onUpdatePosition={onUpdateTextScreenPos}
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
  const [hoveredNodeWorldPos, setHoveredNodeWorldPos] = useState<THREE.Vector3 | null>(null);
  const [textScreenPos, setTextScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [showTextOverlay, setShowTextOverlay] = useState(false);
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
    setHoveredNodeWorldPos(position);
    setShowTextOverlay(true);
  };

  const handlePointerOut = () => {
    setIsInteracting(false);
    setHoveredText(null);
    setHoveredNodeIsCenter(false);
    setShowTextOverlay(false);
    setHoveredNodeWorldPos(null);
    document.body.style.cursor = 'default';
  };

  const handleUpdateTextScreenPos = useCallback((screenPos: { x: number; y: number } | null) => {
    setTextScreenPos(screenPos);
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
      {/* Inject CSS Keyframes for the glow animation */} 
      <style>
        {`
          @keyframes breathingGlow {
            0% {
              box-shadow: 0 0 0.8rem 0.3rem #7C3AED; /* Start/End state */
              opacity: 0.2;
            }
            50% {
              /* Reduced brightness at peak */
              box-shadow: 0 0 1.2rem 0.5rem #A78BFA; 
              opacity: 0.3; 
            }
            100% {
              box-shadow: 0 0 0.8rem 0.3rem #7C3AED; /* Return to start */
              opacity: 0.2;
            }
          }
        `}
      </style>
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
            hoveredNodeIsCenter={hoveredNodeIsCenter}
            hoveredNodeTrackPosition={hoveredNodeWorldPos}
            onUpdateTextScreenPos={handleUpdateTextScreenPos}
            isInteracting={isInteracting}
            controlsRef={controlsRef}
          />
        )}
      </Canvas>
      {showTextOverlay && textScreenPos && hoveredText && (
        <div 
          style={{
            position: 'absolute',
            left: `calc(50% + ${textScreenPos.x}px)`,
            top: `calc(50% + ${textScreenPos.y}px)`,
            transform: 'translate(-50%, -50%)',
            ...(hoveredNodeIsCenter 
              ? { // Center node text: Darker Purple Gradient
                  background: 'linear-gradient(to right, #A78BFA, #8B5CF6, #7C3AED)', // Updated darker colors
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  opacity: 0.9,
                } 
              : { // Other nodes text: Darker Solid color
                  color: '#A78BFA', // Updated darker color (violet-400)
                  fontWeight: 'normal',
                  fontSize: '13px',
                  opacity: 1.0,
                }),
            padding: '4px 8px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            pointerEvents: 'none',
            transition: 'opacity 0.2s ease-in-out, color 0.2s ease-in-out'
          }}
        >
          {hoveredText} 
        </div>
      )}
    </div>
  );
} 