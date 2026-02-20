import { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { detectWebGL } from '../lib/webglDetector';

// 3D Map Mesh Component - Static version without automatic animations
function MapMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Load the map texture
  const texture = useTexture('/assets/generated/al-buraimi-3d-map.png');

  // No automatic rotation or animation - completely static unless user interacts

  return (
    <mesh
      ref={meshRef}
      scale={1}
    >
      <planeGeometry args={[4, 4, 32, 32]} />
      <meshStandardMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent={true}
        opacity={1}
        roughness={0.5}
        metalness={0.2}
      />
    </mesh>
  );
}

// Lighting setup
function Lights() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.4} />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        castShadow
      />
    </>
  );
}

// Static 2D Fallback Component
function StaticMapFallback() {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <img
        src="/assets/generated/al-buraimi-3d-map.png"
        alt="خريطة محافظة البريمي"
        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
      />
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm text-gray-700 pointer-events-none z-10">
        <span>خريطة ثنائية الأبعاد - محافظة البريمي</span>
      </div>
    </div>
  );
}

// Main Interactive 3D Map Component with automatic fallback
export default function Interactive3DMap() {
  const [webglSupport, setWebglSupport] = useState<{ supported: boolean; shouldUseFallback: boolean } | null>(null);

  useEffect(() => {
    const support = detectWebGL();
    setWebglSupport(support);
  }, []);

  // Show loading state while detecting WebGL
  if (!webglSupport) {
    return (
      <div className="relative w-full h-[500px] lg:h-[600px] rounded-xl overflow-hidden shadow-xl border border-gray-300 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">جاري تحميل الخريطة...</p>
        </div>
      </div>
    );
  }

  // Use static 2D fallback on mobile or when WebGL is not supported
  if (webglSupport.shouldUseFallback) {
    return (
      <div className="relative w-full h-[500px] lg:h-[600px] rounded-xl overflow-hidden shadow-xl border border-gray-300">
        <StaticMapFallback />
      </div>
    );
  }

  // Render 3D map with WebGL
  return (
    <div className="relative w-full h-[500px] lg:h-[600px] rounded-xl overflow-hidden shadow-xl border border-gray-300 bg-gradient-to-br from-blue-50 to-green-50">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        {/* Camera positioned to center on Al Buraimi map - static initial view */}
        <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={50} />
        
        <Lights />
        
        <MapMesh />
        
        {/* OrbitControls for user interaction - rotation, zoom, and pan enabled but no auto-rotate */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          autoRotate={false}
          autoRotateSpeed={0}
          minDistance={3}
          maxDistance={10}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          panSpeed={0.5}
          enableDamping={true}
          target={[0, 0, 0]}
        />
      </Canvas>
      
      {/* Interaction hint overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm text-gray-700 pointer-events-none z-10">
        <span className="hidden md:inline">استخدم الماوس للتدوير والتكبير والتحريك</span>
        <span className="md:hidden">اسحب للتدوير • اقرص للتكبير • اسحب بإصبعين للتحريك</span>
      </div>
    </div>
  );
}
