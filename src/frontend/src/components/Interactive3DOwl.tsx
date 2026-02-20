import { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface OwlModelProps {
  scale?: number;
}

// 3D Owl Model Component using the new realistic transparent owl texture
function OwlModel({ scale = 1 }: OwlModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Load the new realistic transparent owl texture - perfectly clean transparent background
  // React Hooks must be called at the top level, not conditionally
  const texture = useTexture('/assets/generated/new-realistic-owl-perfect-transparent.dim_400x400.png');
  
  useEffect(() => {
    if (texture) {
      // Maximum transparency enforcement - eliminate all background artifacts
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.premultiplyAlpha = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      texture.anisotropy = 16;
    }
  }, [texture]);

  if (!texture) {
    return null;
  }

  return (
    <group ref={groupRef}>
      {/* Main owl sprite with perfectly transparent texture - only owl visible */}
      <sprite scale={[2.5 * scale, 2.5 * scale, 1]}>
        <spriteMaterial 
          map={texture} 
          transparent={true}
          opacity={1}
          depthTest={true}
          depthWrite={false}
          alphaTest={0.95}
          sizeAttenuation={true}
          blending={THREE.NormalBlending}
          premultipliedAlpha={false}
          toneMapped={false}
          side={THREE.DoubleSide}
          fog={false}
          precision="highp"
        />
      </sprite>
      
      {/* Add subtle 3D depth with shadow plane */}
      <mesh position={[0, -1.2, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshBasicMaterial 
          color={0x000000} 
          transparent={true} 
          opacity={0.12}
        />
      </mesh>
    </group>
  );
}

interface Interactive3DOwlProps {
  width?: string;
  height?: string;
  className?: string;
  enableZoom?: boolean;
  enableRotation?: boolean;
  autoRotate?: boolean;
}

export default function Interactive3DOwl({
  width = '100%',
  height = '400px',
  className = '',
  enableZoom = false,
  enableRotation = false,
  autoRotate = false,
}: Interactive3DOwlProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check if WebGL is supported
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setHasError(true);
      }
    } catch (e) {
      setHasError(true);
    }
  }, []);

  if (hasError) {
    return (
      <div 
        className={`relative flex items-center justify-center ${className}`}
        style={{ 
          width, 
          height,
          background: 'transparent',
          backgroundColor: 'transparent',
        }}
      >
        <img 
          src="/assets/generated/new-realistic-owl-perfect-transparent.dim_400x400.png"
          alt="البومة"
          className="w-full h-full object-contain"
          style={{
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
          }}
        />
      </div>
    );
  }

  return (
    <div 
      className={`relative ${className}`} 
      style={{ 
        width, 
        height, 
        background: 'transparent',
        backgroundColor: 'transparent',
        isolation: 'isolate',
        overflow: 'hidden',
        border: 'none',
        outline: 'none',
        boxShadow: 'none'
      }}
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
    >
      <Canvas
        shadows={false}
        gl={{ 
          antialias: true, 
          alpha: true,
          preserveDrawingBuffer: false,
          premultipliedAlpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          logarithmicDepthBuffer: false,
          precision: 'highp',
          failIfMajorPerformanceCaveat: false
        }}
        style={{ 
          background: 'transparent',
          backgroundColor: 'transparent',
          pointerEvents: enableRotation || enableZoom ? 'auto' : 'none',
          border: 'none',
          outline: 'none',
          boxShadow: 'none'
        }}
        dpr={[1, 2]}
        linear={true}
        flat={false}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        {/* Camera */}
        <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={50} />

        {/* Lighting - optimized for natural realistic owl appearance */}
        <ambientLight intensity={0.85} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.55}
        />
        <directionalLight position={[-5, 3, -5]} intensity={0.35} />
        <pointLight position={[0, 2, 2]} intensity={0.25} />

        {/* 3D Owl Model with perfectly transparent texture */}
        <OwlModel scale={1} />

        {/* Controls */}
        <OrbitControls
          enableZoom={enableZoom}
          enableRotate={enableRotation}
          enablePan={false}
          autoRotate={autoRotate && !isInteracting}
          autoRotateSpeed={1}
          minDistance={2}
          maxDistance={8}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>

      {/* Interaction Hint in Arabic - only show if interaction is enabled */}
      {(enableRotation || enableZoom) && !isInteracting && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm pointer-events-none">
          {enableRotation && enableZoom ? 'اسحب للتدوير • قرّب للتكبير' : enableRotation ? 'اسحب للتدوير' : 'قرّب للتكبير'}
        </div>
      )}
    </div>
  );
}
