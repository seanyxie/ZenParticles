import * as THREE from 'three';
import { ShapeType } from '../types';

export const generateShapePositions = (type: ShapeType, count: number): Float32Array => {
  const positions = new Float32Array(count * 3);
  const tempVec = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    const idx = i * 3;

    switch (type) {
      case ShapeType.HEART: {
        // Heart curve
        const t = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 0.3); // distribute internally
        // Parametric heart
        x = 16 * Math.pow(Math.sin(t), 3);
        y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        z = (Math.random() - 0.5) * 4;
        
        x *= 0.1 * r;
        y *= 0.1 * r;
        z *= r;
        break;
      }
      case ShapeType.SATURN: {
        // Planet + Ring
        const isRing = Math.random() > 0.6;
        if (isRing) {
          const theta = Math.random() * Math.PI * 2;
          const radius = 2.5 + Math.random() * 1.5;
          x = radius * Math.cos(theta);
          z = radius * Math.sin(theta);
          y = (Math.random() - 0.5) * 0.2;
        } else {
          // Sphere
          const r = 1.5 * Math.pow(Math.random(), 1/3);
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta);
          z = r * Math.cos(phi);
        }
        break;
      }
      case ShapeType.FLOWER: {
        // Rose curve / Flower
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI;
        // k = 4 for 8 petals
        const r = Math.cos(4 * theta) + 2; 
        
        // Convert polar to cartesian + volume
        const dist = r * Math.random() * 0.8;
        x = dist * Math.cos(theta);
        y = dist * Math.sin(theta);
        z = (Math.random() - 0.5) * 1.5 * Math.exp(-dist * 0.5);
        break;
      }
      case ShapeType.BUDDHA: {
        // Simplified sitting figure using stacked primitives
        const part = Math.random();
        
        if (part < 0.2) { 
          // Head (Sphere)
          const r = 0.5;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta) + 1.8;
          z = r * Math.cos(phi);
        } else if (part < 0.6) {
          // Body (Cylinder/Cone-ish)
          const h = 2.0; // Height
          const yPos = Math.random() * h; // 0 to 2
          const radiusAtY = 1.0 - (yPos * 0.2); // Taper up
          const theta = Math.random() * Math.PI * 2;
          const r = Math.sqrt(Math.random()) * radiusAtY;
          x = r * Math.cos(theta);
          y = yPos - 0.5;
          z = r * Math.sin(theta);
        } else {
          // Legs (Crossed Torus-ish base)
          const theta = Math.random() * Math.PI * 2;
          const tubeRadius = 0.4;
          const majorRadius = 1.2;
          const phi = Math.random() * Math.PI * 2;
          
          const tr = tubeRadius * Math.sqrt(Math.random());
          
          x = (majorRadius + tr * Math.cos(phi)) * Math.cos(theta);
          z = (majorRadius + tr * Math.cos(phi)) * Math.sin(theta);
          y = tr * Math.sin(phi) - 0.5;
          
          // Flatten z for crossed legs effect
          z *= 0.6;
        }
        break;
      }
      case ShapeType.FIREWORKS: {
        // Explosion sphere
        const r = 4 * Math.cbrt(Math.random()); // Even volume
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
        break;
      }
      case ShapeType.NUMBER_1: {
        x = (Math.random() - 0.5) * 0.5; 
        y = (Math.random() - 0.5) * 2.5;
        z = (Math.random() - 0.5) * 0.5;
        break;
      }
      case ShapeType.NUMBER_2: {
        const t = Math.random();
        if (t < 0.4) { // Top curve
             const theta = Math.random() * Math.PI; 
             x = 0.7 * Math.cos(theta);
             y = 0.7 * Math.sin(theta) + 0.5;
        } else if (t < 0.7) { // Diagonal
             const d = Math.random();
             x = 0.7 * (1 - 2 * d);
             y = 0.5 - 1.5 * d;
        } else { // Base
             const d = Math.random();
             x = -0.7 + 1.4 * d;
             y = -1.0;
        }
        z = (Math.random() - 0.5) * 0.4;
        break;
      }
      case ShapeType.NUMBER_3: {
        const t = Math.random();
        if (t < 0.5) { // Top
            const theta = -Math.PI/4 + Math.random() * (Math.PI * 1.25);
            x = 0.6 * Math.cos(theta);
            y = 0.6 * Math.sin(theta) + 0.6;
        } else { // Bottom
            const theta = -Math.PI + Math.random() * (Math.PI * 1.25);
            x = 0.7 * Math.cos(theta);
            y = 0.7 * Math.sin(theta) - 0.6;
        }
        z = (Math.random() - 0.5) * 0.4;
        break;
      }
      case ShapeType.NUMBER_4: {
        const t = Math.random();
        // Shape 4: Vertical line, Diagonal, Horizontal bar
        if (t < 0.4) {
            // Right Vertical line
            x = 0.5 + (Math.random() * 0.2); 
            y = (Math.random() * 2.4) - 1.2; 
        } else if (t < 0.7) {
            // Diagonal (Top left to mid right)
            const d = Math.random(); // 0 to 1
            x = -0.5 + d * 1.0; 
            y = 1.0 - d * 1.2;
        } else {
            // Horizontal bar
            x = (Math.random() * 1.4) - 0.6; 
            y = -0.2 + (Math.random() * 0.2);
        }
        z = (Math.random() - 0.5) * 0.4;
        break;
      }
      default:
        break;
    }

    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;
  }

  return positions;
};