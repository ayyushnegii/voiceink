import React from "react";
import { SoundWaveIcon, VoiceWaveIndicator, LoadingDots } from "./DictationIcons";
import { Tooltip } from "./Tooltip";

interface DictationBubbleProps {
  isRecording: boolean;
  isProcessing: boolean;
  isHovered: boolean;
  isDragging: boolean;
  hasDragged: boolean;
  hotkey: string;
  onToggle: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function DictationBubble({
  isRecording,
  isProcessing,
  isHovered,
  isDragging,
  hasDragged,
  hotkey,
  onToggle,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseEnter,
  onMouseLeave,
}: DictationBubbleProps) {
  // Determine current mic state
  const getMicState = () => {
    if (isRecording) return "recording";
    if (isProcessing) return "processing";
    if (isHovered && !isRecording && !isProcessing) return "hover";
    return "idle";
  };

  const micState = getMicState();
  const isListening = isRecording || isProcessing;

  // Get button properties based on state
  const getMicButtonProps = () => {
    const baseClasses =
      "rounded-full w-10 h-10 flex items-center justify-center relative overflow-hidden border-2 border-white/70 cursor-pointer";

    switch (micState) {
      case "idle":
        return {
          className: `${baseClasses} bg-black/50 cursor-pointer`,
          tooltip: `Press [${hotkey}] to speak`,
        };
      case "hover":
        return {
          className: `${baseClasses} bg-black/50 cursor-pointer`,
          tooltip: `Press [${hotkey}] to speak`,
        };
      case "recording":
        return {
          className: `${baseClasses} bg-blue-600 cursor-pointer`,
          tooltip: "Recording...",
        };
      case "processing":
        return {
          className: `${baseClasses} bg-purple-600 cursor-not-allowed`,
          tooltip: "Processing...",
        };
      default:
        return {
          className: `${baseClasses} bg-black/50 cursor-pointer`,
          style: { transform: "scale(0.8)" },
          tooltip: "Click to speak",
        };
    }
  };

  const micProps = getMicButtonProps();

  return (
    <>
      {/* Fixed bottom-right voice button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Tooltip content={micProps.tooltip}>
          <button
            onMouseDown={(e) => {
              onMouseDown(e);
            }}
            onMouseMove={(e) => {
              onMouseMove(e);
            }}
            onMouseUp={(e) => {
              onMouseUp(e);
            }}
            onClick={(e) => {
              if (!hasDragged) {
                onToggle();
              }
              e.preventDefault();
            }}
            onMouseEnter={() => onMouseEnter()}
            onMouseLeave={() => onMouseLeave()}
            onFocus={() => onMouseEnter()}
            onBlur={() => onMouseLeave()}
            className={micProps.className}
            disabled={micState === "processing"}
            style={{
              ...micProps.style,
              cursor:
                micState === "processing"
                  ? "not-allowed !important"
                  : isDragging
                  ? "grabbing !important"
                  : "pointer !important",
              transition:
                "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.25s ease-out",
            }}
          >
            {/* Background effects */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent transition-opacity duration-150"
              style={{ opacity: micState === "hover" ? 0.8 : 0 }}
            ></div>
            <div
              className="absolute inset-0 transition-colors duration-150"
              style={{
                backgroundColor:
                  micState === "hover" ? "rgba(0,0,0,0.1)" : "transparent",
              }}
            ></div>

            {/* Dynamic content based on state */}
            {micState === "idle" || micState === "hover" ? (
              <SoundWaveIcon size={micState === "idle" ? 12 : 14} />
            ) : micState === "recording" ? (
              <LoadingDots />
            ) : micState === "processing" ? (
              <VoiceWaveIndicator isListening={true} />
            ) : null}

            {/* State indicator ring for recording */}
            {micState === "recording" && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-300 animate-pulse"></div>
            )}

            {/* State indicator ring for processing */}
            {micState === "processing" && (
              <div className="absolute inset-0 rounded-full border-2 border-purple-300 opacity-50"></div>
            )}
          </button>
        </Tooltip>
      </div>
    </>
  );
}
