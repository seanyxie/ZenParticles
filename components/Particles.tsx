import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HandData, ShapeType } from '../types';
import { generateShapePositions } from '../utils/geometry';

interface ParticlesProps {
  handData: React.MutableRefObject<HandData>;
  shape: ShapeType;
  color: string;
  count?: number;
}

const Particles: React.FC<ParticlesProps> = ({ handData, shape, color, count = 8000 }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  
  // Store original positions for the current shape
  const targetPositions = useMemo(() => {
    return generateShapePositions(shape, count);
  }, [shape, count]);

  // Current positions array (for interpolation)
  const currentPositions = useMemo(() => {
    return new Float32Array(count * 3);
  }, [count]);

  // Generate random speeds for each particle to create "trail" effect
  // Some particles are fast (stick to hand), some are slow (lag behind)
  const particleSpeeds = useMemo(() => {
    const speeds = new Float32Array(count);
    for(let i=0; i<count; i++) {
        // Range from 1.0 (very slow/draggy) to 8.0 (fast/responsive)
        speeds[i] = 1.0 + Math.random() * 7.0;
    }
    return speeds;
  }, [count]);

  useEffect(() => {
    // Optional: Add specific trigger effects on shape change
  }, [shape]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const { isPresent, position: handPos, pinchDistance, rotation } = handData.current;
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

    // Base smooth factors
    const followSpeedBase = delta; 

    // Calculate global transformation based on hand
    // If hand is not present, drift to center
    const targetCenterX = isPresent ? handPos.x * 4 : 0; // Scale multiplier for screen coverage
    const targetCenterY = isPresent ? handPos.y * 3 : 0; 
    
    // Pinch controls scale/spread
    const targetScale = isPresent ? 0.2 + (pinchDistance * 1.8) : 1.0;

    // --- Color Dynamics ---
    if (materialRef.current) {
        const time = state.clock.elapsedTime;
        const colorObj = new THREE.Color(color);
        const hsl = { h: 0, s: 0, l: 0 };
        colorObj.getHSL(hsl);

        // Shift hue slowly over time + adds a bit of shimmer
        // 0.05 is the speed of color rotation
        const newHue = (hsl.h + time * 0.05) % 1; 
        
        // Pulse lightness slightly
        const newLightness = Math.min(1, Math.max(0, hsl.l + Math.sin(time * 2) * 0.1));
        
        materialRef.current.color.setHSL(newHue, hsl.s, newLightness);
    }
    
    // Update Particles
    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      // 1. Get Target Position (Shape Local Space)
      let tx = targetPositions[idx];
      let ty = targetPositions[idx + 1];
      let tz = targetPositions[idx + 2];

      // 2. Apply Rotation (Hand Rotation)
      if (isPresent) {
        const cosR = Math.cos(rotation);
        const sinR = Math.sin(rotation);
        const rx = tx * cosR - ty * sinR;
        const ry = tx * sinR + ty * cosR;
        tx = rx;
        ty = ry;
      }

      // 3. Apply Scale (Hand Pinch)
      tx *= targetScale;
      ty *= targetScale;
      tz *= targetScale;

      // 4. Apply Translation (Hand Position)
      tx += targetCenterX;
      ty += targetCenterY;
      
      // Add some noise/hover if hand is missing
      if (!isPresent) {
        const time = state.clock.elapsedTime;
        ty += Math.sin(time + i * 0.01) * 0.1;
      }

      // 5. Physics / Interpolation
      // Variable speed per particle creates the trail effect
      const speed = particleSpeeds[i] * followSpeedBase;

      // Elastic easing toward target
      const vx = (tx - positions[idx]) * speed;
      const vy = (ty - positions[idx + 1]) * speed;
      const vz = (tz - positions[idx + 2]) * speed;

      positions[idx] += vx;
      positions[idx + 1] += vy;
      positions[idx + 2] += vz;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Global Auto-Rotation Logic
    // If it's a number shape, force it to face the screen (rotation 0)
    // Otherwise, allow the gentle auto-rotation
    const isNumberShape = [
        ShapeType.NUMBER_1, 
        ShapeType.NUMBER_2, 
        ShapeType.NUMBER_3, 
        ShapeType.NUMBER_4
    ].includes(shape);
    
    if (isNumberShape) {
        // Normalize rotation to range [0, 2PI]
        if (Math.abs(pointsRef.current.rotation.y) > Math.PI * 2) {
            pointsRef.current.rotation.y %= (Math.PI * 2);
        }
        // Smoothly return to 0
        pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, 0, delta * 3);
    } else {
        pointsRef.current.rotation.y += delta * 0.1; // Slight global auto-rotation
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={currentPositions.length / 3}
          array={currentPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.06}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default Particles;