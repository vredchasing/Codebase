import React, { Suspense, forwardRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

import './IpadModel.css'

const Ipad = forwardRef(({ onLoad }, ref) => {
  const gltf = useGLTF('/models/ipad.glb');

  useEffect(() => {
    if (onLoad) onLoad();
  }, [gltf, onLoad]);

  return (
    <primitive
      ref={ref}
      object={gltf.scene}
      scale={[4, 4, 4]}
      position={[1.57, -0.5, 1.57]}
      rotation={[-1.57, 0, 1.57]}
    />
  );
});


export default function IpadModel({ ipadRef, onLoad }) {
  return (
    <div style={{display:'flex', width: '100%', height: '100vh'}}>
      <Canvas
        camera={{ position: [0, 1, 3], fov: 45 }}
        gl={{ alpha: true }}
        style={{ background: 'transparent' }}
      >
        <color attach="background" args={[null]} />
        <ambientLight intensity={0.6} />
        <directionalLight intensity={1} position={[5, 5, 5]} />
        <Suspense fallback={null}>
          <Ipad ref={ipadRef} onLoad={onLoad}/>
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}
