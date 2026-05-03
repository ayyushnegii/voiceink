# Claudeadj — VoiceInk Complete Fix & Improvement Log

> Maintained by Claude. Updated each session. All changes committed to `main`.

---

## VoiceInk vs Wispr Flow — Honest Assessment

| Feature | Wispr Flow | VoiceInk (before) | VoiceInk (after) |
|---|---|---|---|
| Global hotkey dictation | ✅ | ✅ | ✅ |
| Local on-device Whisper | ❌ (cloud only) | ✅ | ✅ |
| Privacy — no data sent | ❌ | ✅ (local mode) | ✅ |
| Context-aware tone (email/code/chat) | ✅ | ✅ | ✅ |
| AI text cleanup (reasoning model) | ✅ | ✅ (broken) | ✅ (fixed) |
| Hinglish / bilingual mode | ❌ | ✅ (broken) | ✅ (fixed) |
| VAD — auto-stop on silence | ✅ | ❌ | ✅ NEW |
| Real-time audio waveform feedback | ✅ | ❌ (fake animation) | ✅ NEW |
| Text snippets / shortcuts | ❌ | ✅ | ✅ |
| Custom vocabulary | ❌ | ✅ | ✅ |
| Price | $19/month | Free + your API key | Free + your API key |
| Open source | ❌ | ✅ | ✅ |

**VoiceInk now beats Wispr Flow** on: price (free vs $19/mo), privacy (local Whisper), open source, Hinglish support, and custom vocabulary/snippets. It matches on core dictation quality.

---

## Session 1 — Bug Fixes

### Bug 1: Wrong UI Component Import Paths (`src/App.jsx`)
- **Problem:** `./ui/Toast` and `./ui/LoadingDots` → missing `/components/` segment → crash at startup
- **Fix:** Corrected to `./components/ui/Toast` and `./components/ui/LoadingDots`

### Bug 2: AudioManager Recreated Every Recording (`src/App.jsx`)
- **Problem:** `new AudioManager()` inside `processAudio()` → fresh instance each time → callbacks lost, memory leak
- **Fix:** Single stable `useRef` instance; callbacks refreshed via `setCallbacks()` before each use

### Bug 3: Stale Closure in IPC Toggle Handler (`src/App.jsx`)
- **Problem:** `isRecording`/`isProcessing` captured at registration → global hotkey breaks after first use
- **Fix:** `isRecordingRef` + `isProcessingRef` updated via `useEffect`; IPC handler reads refs

### Bug 4: Accumulating IPC Listeners (`src/App.jsx`)
- **Problem:** Each render added a new `onToggleDictation` listener without cleanup → memory leak
- **Fix:** `useEffect` returns cleanup function; empty deps `[]` is correct (refs handle freshness)

### Bug 5: Double HotkeyManager (`main.js`)
- **Problem:** `main.js` instantiated `HotkeyManager` AND `WindowManager` does it internally → double hotkey registration, double-firing
- **Fix:** Removed `HotkeyManager` from `main.js`; all hotkey management through `windowManager.initializeHotkey()`

### Bug 6: `processWithReasoningModel` Parameter Mismatch (`src/helpers/audioManager.js`)
- **Problem:** Defined as `(text, context)` but called as `(text, context, hinglishMode)` → Hinglish silently ignored in reasoning path
- **Fix:** Added `hinglishMode = false` as third parameter

---

## Session 2 — Improvements (Beat Wispr Flow)

### Improvement 1: `hinglishMode` Passed Through to ReasoningService
- **Problem:** Even after signature fix, `hinglishMode` was passed to `processWithReasoningModel` but not forwarded to `ReasoningService.processText()`
- **Fix:** `ReasoningService.processText(text, model, context, hinglishMode)` — all 4 params now passed

### Improvement 2: VAD — Voice Activity Detection (`src/helpers/audioManager.js`)
- **What:** Auto-stops recording after 1.5s of silence (configurable via `vadSilenceDuration` localStorage key)
- **How:** `startVAD(stream, { silenceDuration, onSilence })` — uses Web Audio API `AnalyserNode`, polls RMS level via `requestAnimationFrame`, fires `onSilence()` callback after threshold silence duration
- **Enabled by default.** Disable: `localStorage.setItem("useVAD", "false")`
- **This is the #1 thing Wispr Flow has that VoiceInk didn't**

### Improvement 3: Real-Time Audio Level Monitor (`src/helpers/audioManager.js`)
- **What:** Emits real microphone amplitude (0–1) via `onStateChange` callback during recording
- **How:** `startLevelMonitor(stream, onLevel)` — `AnalyserNode` with `getByteFrequencyData`, averages frequency bins, calls `onLevel` every animation frame
- **Wire-up:** `onStateChange` now receives `{ isRecording, isProcessing, audioLevel }` where `audioLevel` is 0–1

### Improvement 4: Live Waveform UI (`src/App.jsx`)
- **What:** 5-bar waveform that actually moves with your voice, replacing fake CSS pulse animation
- **How:** `VoiceWaveIndicator` now takes `audioLevel` prop and sets bar heights dynamically using spread coefficients `[0.6, 0.9, 1.0, 0.9, 0.6]`
- **Processing state:** Shows flat low bars (audio level 0) — visually distinct from idle

---

## Files Changed

| File | Changes |
|---|---|
| `src/App.jsx` | Import paths, stable AudioManager ref, stale closures, IPC cleanup, audioLevel state, live waveform |
| `src/helpers/audioManager.js` | hinglishMode param fix, hinglishMode forwarded to ReasoningService, VAD, audio level monitor, startRecording wired to both |
| `main.js` | Removed duplicate HotkeyManager |
| `Claudeadj.md` | This file |

---

## Architecture Notes

### AudioManager Data Flow (Post-Fix)
```
App.jsx
  └─ getAudioManager() → single AudioManager ref
       └─ setCallbacks({ onStateChange, onError, onTranscriptionComplete })
            onStateChange({ isRecording, isProcessing, audioLevel })
                 → setIsRecording / setIsProcessing / setAudioLevel

AudioManager.startRecording()
  ├─ startLevelMonitor(stream) → onStateChange({ audioLevel: 0-1 }) @ 60fps
  ├─ startVAD(stream) → stopRecording() after silence
  └─ MediaRecorder.onstop → processAudio(blob)
       └─ processWithLocalWhisper OR processWithOpenAIAPI
            └─ processWithReasoningModel(text, context, hinglishMode)
                 └─ ReasoningService.processText(text, model, context, hinglishMode)
```

### Key localStorage Settings
| Key | Default | Description |
|---|---|---|
| `useVAD` | `"true"` | Auto-stop on silence |
| `vadSilenceDuration` | `"1500"` | ms of silence before auto-stop |
| `useLocalWhisper` | `"false"` | Use on-device Whisper |
| `whisperModel` | `"base"` | Whisper model size |
| `hinglishMode` | `"false"` | Hinglish transcription |
| `useReasoningModel` | `"false"` | AI text cleanup |
| `reasoningModel` | `"gpt-3.5-turbo"` | Which model for cleanup |
| `preferredLanguage` | `"auto"` | Language hint for Whisper |
| `allowOpenAIFallback` | `"false"` | Fallback to OpenAI if local fails |

---

*Repo: ayyushnegii/Voiceink — Claude sessions: 2*
