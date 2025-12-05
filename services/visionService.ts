import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { HandData } from "../types";

export class VisionService {
  private handLandmarker: HandLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private lastVideoTime = -1;
  private requestAnimationFrameId: number | null = null;
  
  // Callbacks
  public onHandData: ((data: HandData) => void) | null = null;

  async initialize() {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2
      });

      await this.setupCamera();
    } catch (error) {
      console.error("Failed to initialize vision service:", error);
    }
  }

  private async setupCamera() {
    this.video = document.createElement("video");
    this.video.setAttribute("playsinline", "");
    this.video.style.display = "none";
    
    // For debugging, you can append video to body
    // document.body.appendChild(this.video);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: 640,
        height: 480
      },
      audio: false
    });

    this.video.srcObject = stream;
    await this.video.play();
    this.startLoop();
  }

  private startLoop = () => {
    if (this.video && this.handLandmarker) {
      if (this.video.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = this.video.currentTime;
        const result = this.handLandmarker.detectForVideo(this.video, performance.now());
        this.processResults(result);
      }
    }
    this.requestAnimationFrameId = requestAnimationFrame(this.startLoop);
  };

  private processResults(result: HandLandmarkerResult) {
    if (!this.onHandData) return;

    if (result.landmarks && result.landmarks.length > 0) {
      // Use the first detected hand
      const landmarks = result.landmarks[0];
      
      // Calculate Centroid (approximate palm center)
      // Wrist: 0, Middle Finger MCP: 9
      const wrist = landmarks[0];
      const middleMCP = landmarks[9];
      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];

      // Screen coordinates are 0-1. Convert to standardized -1 to 1 for 3D mapping
      // Note: Video X is mirrored usually, we might need to flip X
      const centerX = (wrist.x + middleMCP.x) / 2;
      const centerY = (wrist.y + middleMCP.y) / 2;

      // 1. Calculate Position (Normalized centered at 0,0, flipped X for mirror effect)
      const x = (1 - centerX) * 2 - 1; 
      const y = -(centerY * 2 - 1); // Invert Y because screen Y is down, 3D Y is up
      const z = 0; // Depth is hard with single camera without calibration, keeping 0 for now

      // 2. Calculate Pinch/Openness
      // Distance between thumb tip and index tip
      const dx = thumbTip.x - indexTip.x;
      const dy = thumbTip.y - indexTip.y;
      const dz = thumbTip.z - indexTip.z; // Landmarks have Z (relative depth)
      const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      // Normalize pinch. Typically closed ~0.02, open ~0.15+
      // We map this to 0 (closed) -> 1 (open)
      const minPinch = 0.03;
      const maxPinch = 0.15;
      const pinchNormalized = Math.max(0, Math.min(1, (distance - minPinch) / (maxPinch - minPinch)));

      // 3. Calculate Rotation (Roll)
      // Angle of vector from wrist to middleMCP relative to up vector
      const vecX = middleMCP.x - wrist.x;
      const vecY = middleMCP.y - wrist.y;
      // In screen space +Y is down.
      // At rest (hand up), wrist is below MCP. 
      const rotation = -Math.atan2(vecX, -vecY); // Negative to match 3D rotation direction

      // 4. Calculate Finger Count
      const fingerCount = this.countFingers(landmarks);

      this.onHandData({
        isPresent: true,
        position: { x, y, z },
        pinchDistance: pinchNormalized,
        rotation: rotation,
        fingerCount: fingerCount
      });
    } else {
      this.onHandData({
        isPresent: false,
        position: { x: 0, y: 0, z: 0 },
        pinchDistance: 0.5, // Default resting state
        rotation: 0,
        fingerCount: 0
      });
    }
  }

  private countFingers(landmarks: any[]): number {
    let count = 0;
    const wrist = landmarks[0];
    
    // Helper to calculate 3D distance
    const getDist = (p1: any, p2: any) => {
      return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
    };

    // Fingers 2-5 (Index, Middle, Ring, Pinky)
    // Tips: 8, 12, 16, 20
    // PIP joints: 6, 10, 14, 18
    const fingerTips = [8, 12, 16, 20];
    const fingerPips = [6, 10, 14, 18];

    fingerTips.forEach((tipIdx, i) => {
      const pipIdx = fingerPips[i];
      // If tip is further from wrist than PIP is, it is likely extended
      if (getDist(landmarks[tipIdx], wrist) > getDist(landmarks[pipIdx], wrist) * 1.1) {
        count++;
      }
    });

    // Thumb (Tip 4, Pinky MCP 17)
    // If thumb is open, tip is far from pinky base. If closed, it's closer.
    // Compare against Palm width approx (Index MCP 5 to Pinky MCP 17)
    const thumbTip = landmarks[4];
    const indexMCP = landmarks[5];
    const pinkyMCP = landmarks[17];
    
    const palmWidth = getDist(indexMCP, pinkyMCP);
    const thumbDist = getDist(thumbTip, pinkyMCP);

    if (thumbDist > palmWidth * 1.2) {
      count++;
    }

    return count;
  }

  cleanup() {
    if (this.requestAnimationFrameId) {
      cancelAnimationFrame(this.requestAnimationFrameId);
    }
    if (this.video && this.video.srcObject) {
      const tracks = (this.video.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
    }
    if (this.handLandmarker) {
      this.handLandmarker.close();
    }
  }
}