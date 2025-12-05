import React from 'react';

export enum ShapeType {
  HEART = 'Heart',
  FLOWER = 'Flower',
  SATURN = 'Saturn',
  BUDDHA = 'Buddha',
  FIREWORKS = 'Fireworks',
  NUMBER_1 = 'Number_1',
  NUMBER_2 = 'Number_2',
  NUMBER_3 = 'Number_3',
  NUMBER_4 = 'Number_4',
}

export interface HandData {
  isPresent: boolean;
  position: { x: number; y: number; z: number }; // Normalized -1 to 1
  rotation: number; // Radian Z-axis rotation
  pinchDistance: number; // 0 (closed) to 1 (open)
  fingerCount: number;
}

export interface ParticleConfig {
  count: number;
  color: string;
  shape: ShapeType;
}

// Augment React's JSX namespace (Crucial for React 18+ / TS 5+)
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      ambientLight: any;
      pointLight: any;
      color: any;
    }
  }
}

// Augment Global JSX namespace (Fallback for other environments)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      ambientLight: any;
      pointLight: any;
      color: any;
    }
  }
}
