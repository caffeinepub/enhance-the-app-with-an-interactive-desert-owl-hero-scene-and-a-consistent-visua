import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

// Static 3D Al Buraimi Map Component
// Displays an official and accurate three-dimensional representation of Al Buraimi Governorate
// showing the three wilayats: Al Buraimi, Mahdha, and As-Sunainah
// Completely non-interactive with all user controls disabled
function AlBuraimi3DModel() {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    // Load the official Al Buraimi 3D map texture showing three wilayats
    const loader = new THREE.TextureLoader();
    loader.load(
      '/assets/generated/al-buraimi-official-3d-map.dim_1024x768.png',
      (texture) => {
        textureRef.current = texture;
        if (meshRef.current) {
          meshRef.current.material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.6,
            metalness: 0.15,
            transparent: false,
          });
        }
      },
      undefined,
      (error) => {
        console.error('Error loading Al Buraimi official 3D map texture:', error);
      }
    );
  }, []);

  return (
    <group>
      {/* Main terrain mesh - flat plane with official Al Buraimi map texture */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        castShadow
      >
        <planeGeometry args={[10, 7.5]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.6}
          metalness={0.15}
        />
      </mesh>

      {/* Base layer for depth and realistic appearance */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.15, 0]}
      >
        <planeGeometry args={[10.3, 7.8]} />
        <meshStandardMaterial
          color="#a0826d"
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}

// Realistic lighting setup for natural appearance
function Lighting() {
  return (
    <>
      {/* Ambient light for overall scene illumination */}
      <ambientLight intensity={0.65} />
      
      {/* Main directional light simulating sunlight */}
      <directionalLight
        position={[6, 10, 6]}
        intensity={0.9}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      
      {/* Fill light from opposite side for balanced lighting */}
      <directionalLight
        position={[-4, 6, -4]}
        intensity={0.35}
      />
      
      {/* Soft overhead light for natural appearance */}
      <pointLight
        position={[0, 12, 0]}
        intensity={0.45}
        distance={25}
        decay={2}
      />
      
      {/* Subtle rim light for depth */}
      <spotLight
        position={[0, 8, -8]}
        intensity={0.25}
        angle={Math.PI / 6}
        penumbra={0.5}
      />
    </>
  );
}

export default function Static3DAlBuraimiMap() {
  return (
    <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-xl overflow-hidden shadow-xl border-2 border-gray-300 bg-gradient-to-b from-sky-50 to-blue-100">
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
        }}
        style={{
          background: 'linear-gradient(to bottom, #f0f9ff, #dbeafe)',
        }}
      >
        {/* Fixed camera position for optimal static viewing angle */}
        <PerspectiveCamera
          makeDefault
          position={[0, 9, 13]}
          fov={42}
          near={0.1}
          far={1000}
        />

        {/* Realistic lighting setup */}
        <Lighting />

        {/* Official Al Buraimi 3D Model showing three wilayats */}
        <AlBuraimi3DModel />

        {/* OrbitControls completely disabled for non-interactive fixed view */}
        <OrbitControls
          enabled={false}
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          enableDamping={false}
          target={[0, 0, 0]}
        />
      </Canvas>
      
      {/* Subtle overlay text indicating the three wilayats */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-gray-200">
        <p className="text-xs sm:text-sm text-gray-700 font-medium text-center">
          محافظة البريمي: البريمي • محضة • السنينة
        </p>
      </div>
    </div>
  );
}
