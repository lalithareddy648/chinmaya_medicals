import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

// A single floating medicine (pill or bottle)
const FloatingMedicine = ({ type, position, color }) => {
  const meshRef = useRef();

  // Random rotation speeds
  const rx = useMemo(() => (Math.random() - 0.5) * 0.02, []);
  const ry = useMemo(() => (Math.random() - 0.5) * 0.02, []);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += rx;
      meshRef.current.rotation.y += ry;
      // Gently move upwards
      meshRef.current.position.y += 0.01;
      // Reset position if it goes too high
      if (meshRef.current.position.y > 15) {
        meshRef.current.position.y = -15;
      }
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={position} castShadow receiveShadow>
        {type === 'pill' ? (
          <capsuleGeometry args={[0.3, 0.8, 16, 32]} />
        ) : type === 'bottle' ? (
          <cylinderGeometry args={[0.5, 0.5, 1.2, 32]} />
        ) : (
          <sphereGeometry args={[0.4, 32, 32]} />
        )}
        <meshStandardMaterial 
          color={color} 
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>
    </Float>
  );
};

const Background3D = () => {
  // Generate random items
  const items = useMemo(() => {
    const array = [];
    const colors = ['#12b76a', '#039855', '#a6f4c5', '#f8faf9', '#ffffff'];
    const types = ['pill', 'bottle', 'tablet'];
    
    for (let i = 0; i < 40; i++) {
      array.push({
        id: i,
        type: types[Math.floor(Math.random() * types.length)],
        position: [
          (Math.random() - 0.5) * 30, // x spread
          (Math.random() - 0.5) * 30, // y spread
          (Math.random() - 0.5) * 15 - 5 // z spread (keep them behind)
        ],
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    return array;
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: -1, // Ensure it stays behind all content
      pointerEvents: 'none', // Don't block clicks
      background: 'linear-gradient(135deg, #f8faf9 0%, #eef2f0 100%)' // Fallback background
    }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#a6f4c5" />
        
        {items.map((item) => (
          <FloatingMedicine 
            key={item.id} 
            type={item.type} 
            position={item.position} 
            color={item.color} 
          />
        ))}
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};

export default Background3D;
