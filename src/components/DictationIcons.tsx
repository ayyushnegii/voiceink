import React from "react";

// Sound Wave Icon Component (for idle/hover states)
export const SoundWaveIcon: React.FC<{ size?: number }> = ({ size = 16 }) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <div
        className={`bg-white rounded-full`}
        style={{ width: size * 0.25, height: size * 0.6 }}
      ></div>
      <div
        className={`bg-white rounded-full`}
        style={{ width: size * 0.25, height: size }}
      ></div>
      <div
        className={`bg-white rounded-full`}
        style={{ width: size * 0.25, height: size * 0.6 }}
      ></div>
    </div>
  );
};

// Voice Wave Animation Component (for processing state)
export const VoiceWaveIndicator: React.FC<{ isListening: boolean }> = ({ isListening }) => {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className={`w-0.5 bg-white rounded-full transition-all duration-150 ${
            isListening ? "animate-pulse h-4" : "h-2"
          }`}
          style={{
            animationDelay: isListening ? `${i * 0.1}s` : "0s",
            animationDuration: isListening ? `${0.6 + i * 0.1}s` : "0s",
          }}
        />
      ))}
    </div>
  );
};

// Loading Dots Component (for recording state)
export const LoadingDots: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="flex space-x-1">
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
    </div>
  );
};
