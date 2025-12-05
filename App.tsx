import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import Particles from './components/Particles';
import UIOverlay from './components/UIOverlay';
import { VisionService } from './services/visionService';
import { HandData, ShapeType } from './types';

const App: React.FC = () => {
  const [shape, setShape] = useState<ShapeType>(ShapeType.HEART);
  const [color, setColor] = useState<string>('#00ffff');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs to track state inside the vision callback without closures
  const userSelectedShapeRef = useRef<ShapeType>(ShapeType.HEART);
  const currentShapeRef = useRef<ShapeType>(ShapeType.HEART);

  // Motion Detection Refs
  const lastHandPosRef = useRef<{x: number, y: number} | null>(null);
  const lastTimeRef = useRef<number>(0);
  const stabilityTimerRef = useRef<number>(0); // Time in ms that hand has been stable

  // Mutable ref for high-frequency updates (avoiding React re-renders for every frame)
  const handDataRef = useRef<HandData>({
    isPresent: false,
    position: { x: 0, y: 0, z: 0 },
    rotation: 0,
    pinchDistance: 0.5,
    fingerCount: 0
  });

  const visionService = useRef(new VisionService());

  useEffect(() => {
    const initVision = async () => {
      try {
        await visionService.current.initialize();
        setIsLoading(false);
        
        visionService.current.onHandData = (data) => {
          handDataRef.current = data;
          const now = performance.now();

          if (data.isPresent) {
            // --- Motion Stability Check ---
            let speed = 1.0; // Default high speed
            
            if (lastHandPosRef.current && lastTimeRef.current > 0) {
              const dt = now - lastTimeRef.current;
              const dx = data.position.x - lastHandPosRef.current.x;
              const dy = data.position.y - lastHandPosRef.current.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              
              // Speed in units per millisecond
              if (dt > 0) {
                 speed = dist / dt;
              }
            }

            lastHandPosRef.current = { x: data.position.x, y: data.position.y };
            lastTimeRef.current = now;

            // Threshold: 0.0005 units/ms is roughly slow movement.
            // If speed is low, accumulate stability time.
            if (speed < 0.0008) {
               // Assuming ~30-60ms between frames usually, but we calculate strictly on delta
               // We add the time passed since last frame
               // (Approximation since onHandData is triggered by vision loop)
               stabilityTimerRef.current += (now - (lastTimeRef.current || now) + 50); // +50 pad
            } else {
               // Reset if moving too fast
               stabilityTimerRef.current = 0;
            }

            // Only switch shapes if hand has been stable for > 400ms
            if (stabilityTimerRef.current > 400) {
                // Logic for shape switching based on finger count
                const count = data.fingerCount;
                let targetShape: ShapeType | null = null;

                if (count === 1) targetShape = ShapeType.NUMBER_1;
                else if (count === 2) targetShape = ShapeType.NUMBER_2;
                else if (count === 3) targetShape = ShapeType.NUMBER_3;
                else if (count === 4) targetShape = ShapeType.NUMBER_4;
                else if (count >= 5) targetShape = userSelectedShapeRef.current; // Restore original

                // If target is found and different, update
                if (targetShape && currentShapeRef.current !== targetShape) {
                    setShape(targetShape);
                    currentShapeRef.current = targetShape;
                }
            }
          } else {
            // Reset trackers when hand lost
            lastHandPosRef.current = null;
            stabilityTimerRef.current = 0;
          }
        };
      } catch (err) {
        console.error("Error initializing vision:", err);
        setIsLoading(false);
      }
    };

    initVision();

    return () => {
      visionService.current.cleanup();
    };
  }, []);

  // Wrapper to update both state and ref when user clicks UI
  const handleSetShape = (s: ShapeType) => {
    setShape(s);
    userSelectedShapeRef.current = s;
    currentShapeRef.current = s;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      
      <UIOverlay 
        currentShape={shape} 
        setShape={handleSetShape}
        color={color}
        setColor={setColor}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        isLoading={isLoading}
      />

      <Canvas dpr={[1, 2]} gl={{ antialias: false, alpha: false }}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={60} />
        <color attach="background" args={['#050505']} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <Particles 
          handData={handDataRef} 
          shape={shape} 
          color={color} 
        />
        
        {/* Helper controls if no hand detected or for debug */}
        <OrbitControls enableZoom={false} enablePan={false} dampingFactor={0.05} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};

export default App;