import React, { useState, useEffect, useRef, useCallback } from "react";
import "./index.css";
// FIX: Corrected import paths (were ./ui/Toast and ./ui/LoadingDots — wrong paths)
import { useToast } from "./components/ui/Toast";
import { LoadingDots } from "./components/ui/LoadingDots";
import { useHotkey } from "./hooks/useHotkey";
import { useWindowDrag } from "./hooks/useWindowDrag";
import AudioManager from "./helpers/audioManager";
import { applySnippets } from "./utils/snippetUtils";
import { applyVocabulary } from "./utils/vocabularyUtils";

// Sound Wave Icon Component (for idle/hover states)
const SoundWaveIcon = ({ size = 16 }) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <div className="bg-white rounded-full" style={{ width: size * 0.25, height: size * 0.6 }}></div>
      <div className="bg-white rounded-full" style={{ width: size * 0.25, height: size }}></div>
      <div className="bg-white rounded-full" style={{ width: size * 0.25, height: size * 0.6 }}></div>
    </div>
  );
};

// Voice Wave Animation Component (for processing state)
const VoiceWaveIndicator = ({ isListening }) => {
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

// Enhanced Tooltip Component
const Tooltip = ({ children, content, emoji }) => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div className="relative inline-block">
      <div onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
        {children}
      </div>
      {isVisible && (
        <div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-1 py-1 text-white bg-gradient-to-r from-neutral-800 to-neutral-700 rounded-md whitespace-nowrap z-10 transition-opacity duration-150"
          style={{ fontSize: "9.7px" }}
        >
          {emoji && <span className="mr-1">{emoji}</span>}
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-neutral-800"></div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  // FIX: Single stable AudioManager instance — never re-created per call
  const audioManagerRef = useRef(null);
  // FIX: Refs mirror state so IPC toggle handler is never stale
  const isRecordingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const { toast } = useToast();
  const { hotkey } = useHotkey();
  const { isDragging, handleMouseDown, handleMouseUp } = useWindowDrag();
  const [dragStartPos, setDragStartPos] = useState(null);
  const [hasDragged, setHasDragged] = useState(false);

  // Keep refs in sync with state
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);

  // Returns single AudioManager instance, always refreshing callbacks
  const getAudioManager = useCallback(() => {
    if (!audioManagerRef.current) {
      audioManagerRef.current = new AudioManager();
    }
    audioManagerRef.current.setCallbacks({
      onStateChange: ({ isRecording, isProcessing }) => {
        setIsRecording(isRecording);
        setIsProcessing(isProcessing);
      },
      onError: (err) => {
        toast({ title: err.title, description: err.description, variant: "destructive" });
      },
      onTranscriptionComplete: async (result) => {
        if (result.success && result.text) {
          let text = result.text;
          text = applySnippets(text);
          text = applyVocabulary(text);
          setTranscript(text);
          const pastePromise = safePaste(text);
          window.electronAPI.saveTranscription(text).catch((e) =>
            console.error("Failed to save transcription:", e)
          );
          await pastePromise;
        }
      },
    });
    return audioManagerRef.current;
  }, [toast]);

  const startRecording = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new window.MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        processAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
      toast({ title: "Recording Error", description: "Failed to access microphone: " + err.message, variant: "destructive" });
    }
  };

  const stopRecording = () => {
    // FIX: use ref to avoid stale closure
    if (mediaRecorderRef.current && isRecordingRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const safePaste = async (text) => {
    try {
      await window.electronAPI.pasteText(text);
    } catch (err) {
      toast({ title: "Paste Error", description: "Failed to paste text. Please check accessibility permissions.", variant: "destructive" });
    }
  };

  const processAudio = async (audioBlob) => {
    try {
      console.log(`🎧 [App] 🎬 Starting audio processing...`);
      // FIX: reuse stable instance, don't new AudioManager() every call
      const audioManager = getAudioManager();
      await audioManager.processAudio(audioBlob);
    } catch (err) {
      console.error(`🎧 [App] ❌ Transcription error:`, err);
      toast({ title: "Transcription Error", description: "Transcription failed: " + err.message, variant: "destructive" });
    } finally {
      // Safety net only — AudioManager callbacks are primary source of truth
      setIsProcessing((prev) => (prev ? false : prev));
    }
  };

  const handleClose = () => window.electronAPI.hideWindow();

  // FIX: Register IPC listener ONCE. Refs handle freshness — no stale closure, no accumulating listeners.
  useEffect(() => {
    const handleToggle = () => {
      if (!isRecordingRef.current && !isProcessingRef.current) {
        startRecording();
      } else if (isRecordingRef.current) {
        stopRecording();
      }
    };
    const cleanup = window.electronAPI.onToggleDictation(handleToggle);
    return () => { if (typeof cleanup === "function") cleanup(); };
  }, []); // empty deps intentional — refs handle freshness

  const toggleListening = () => {
    if (!isRecordingRef.current && !isProcessingRef.current) startRecording();
    else if (isRecordingRef.current) stopRecording();
  };

  useEffect(() => {
    const handleKeyPress = (e) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  // Cleanup AudioManager on unmount
  useEffect(() => {
    return () => { if (audioManagerRef.current) audioManagerRef.current.cleanup(); };
  }, []);

  const getMicState = () => {
    if (isRecording) return "recording";
    if (isProcessing) return "processing";
    if (isHovered) return "hover";
    return "idle";
  };

  const micState = getMicState();

  const getMicButtonProps = () => {
    const base = "rounded-full w-10 h-10 flex items-center justify-center relative overflow-hidden border-2 border-white/70 cursor-pointer";
    switch (micState) {
      case "idle":
      case "hover":
        return { className: `${base} bg-black/50`, tooltip: `Press [${hotkey}] to speak` };
      case "recording":
        return { className: `${base} bg-blue-600`, tooltip: "Recording..." };
      case "processing":
        return { className: `${base} bg-purple-600 cursor-not-allowed`, tooltip: "Processing..." };
      default:
        return { className: `${base} bg-black/50`, style: { transform: "scale(0.8)" }, tooltip: "Click to speak" };
    }
  };

  const micProps = getMicButtonProps();

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Tooltip content={micProps.tooltip}>
          <button
            onMouseDown={(e) => {
              setDragStartPos({ x: e.clientX, y: e.clientY });
              setHasDragged(false);
              handleMouseDown(e);
            }}
            onMouseMove={(e) => {
              if (dragStartPos && !hasDragged) {
                const dist = Math.sqrt(Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2));
                if (dist > 5) setHasDragged(true);
              }
            }}
            onMouseUp={(e) => { handleMouseUp(e); setDragStartPos(null); }}
            onClick={(e) => { if (!hasDragged) toggleListening(); e.preventDefault(); }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
            className={micProps.className}
            disabled={micState === "processing"}
            style={{
              ...micProps.style,
              // FIX: removed invalid "!important" suffix from inline cursor strings
              cursor: micState === "processing" ? "not-allowed" : isDragging ? "grabbing" : "pointer",
              transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.25s ease-out",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent transition-opacity duration-150"
              style={{ opacity: micState === "hover" ? 0.8 : 0 }}></div>
            <div className="absolute inset-0 transition-colors duration-150"
              style={{ backgroundColor: micState === "hover" ? "rgba(0,0,0,0.1)" : "transparent" }}></div>

            {micState === "idle" || micState === "hover" ? (
              <SoundWaveIcon size={micState === "idle" ? 12 : 14} />
            ) : micState === "recording" ? (
              <LoadingDots />
            ) : micState === "processing" ? (
              <VoiceWaveIndicator isListening={true} />
            ) : null}

            {micState === "recording" && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-300 animate-pulse"></div>
            )}
            {micState === "processing" && (
              <div className="absolute inset-0 rounded-full border-2 border-purple-300 opacity-50"></div>
            )}
          </button>
        </Tooltip>
      </div>
    </>
  );
}
