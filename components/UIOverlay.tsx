import React from 'react';
import { ShapeType } from '../types';

interface UIOverlayProps {
  currentShape: ShapeType;
  setShape: (s: ShapeType) => void;
  color: string;
  setColor: (c: string) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isLoading: boolean;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  currentShape,
  setShape,
  color,
  setColor,
  isFullscreen,
  toggleFullscreen,
  isLoading
}) => {
  // Filter out the number shapes from the UI buttons
  const shapes = Object.values(ShapeType).filter(s => 
    ![ShapeType.NUMBER_1, ShapeType.NUMBER_2, ShapeType.NUMBER_3, ShapeType.NUMBER_4].includes(s)
  );
  
  const colors = ['#00ffff', '#ff00ff', '#ffff00', '#ff4444', '#44ff44', '#ffffff'];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div>
            <h1 className="text-white text-3xl font-bold tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            ZEN PARTICLES
            </h1>
            <p className="text-gray-400 text-sm mt-1 max-w-xs">
            {isLoading 
                ? "Initializing Vision AI..." 
                : "Raise hand. Pinch to scale. Move to guide."}
            </p>
            <p className="text-cyan-500 text-xs mt-1 animate-pulse">
                Hint: Hold hand still & show 1-4 fingers to morph!
            </p>
        </div>
        <button 
            onClick={toggleFullscreen}
            className="text-white border border-white/20 hover:bg-white/10 rounded-full p-2 transition-all"
        >
            {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
            )}
        </button>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
             <div className="w-12 h-12 border-4 border-t-cyan-500 border-white/10 rounded-full animate-spin"></div>
             <p className="text-cyan-500 mt-4 text-sm tracking-widest animate-pulse">LOADING AI MODELS</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-4 items-end pointer-events-auto">
        
        {/* Shape Selector */}
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-full max-w-sm">
            <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Model</h3>
            <div className="flex flex-wrap gap-2 justify-end">
                {shapes.map((s) => (
                    <button
                        key={s}
                        onClick={() => setShape(s)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 border ${
                            currentShape === s 
                            ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                            : 'bg-transparent text-gray-300 border-white/10 hover:border-white/40'
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>

        {/* Color Selector */}
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3 text-right">Base Color</h3>
            <div className="flex gap-3 justify-end">
                {colors.map((c) => (
                    <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full transition-transform duration-300 ${
                            color === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c, boxShadow: `0 0 10px ${c}80` }}
                    />
                ))}
                <input 
                    type="color" 
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded-full overflow-hidden border-none p-0 bg-transparent cursor-pointer"
                />
            </div>
        </div>

      </div>
    </div>
  );
};

export default UIOverlay;