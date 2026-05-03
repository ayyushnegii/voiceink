# Claudeadj — VoiceInk Complete Fix & Improvement Log

> Maintained by Claude. Updated each session. All changes committed to `main`.

---

## VoiceInk vs Wispr Flow — Current Status

| Feature | Wispr Flow ($19/mo) | VoiceInk (free) |
|---|---|---|
| Global hotkey dictation | ✅ | ✅ |
| Local on-device Whisper | ❌ cloud only | ✅ |
| Privacy — no data sent | ❌ | ✅ local mode |
| Context-aware tone (email/code/chat) | ✅ | ✅ |
| AI text cleanup (reasoning model) | ✅ | ✅ fixed |
| Hinglish / bilingual mode | ❌ | ✅ fully fixed |
| VAD — auto-stop on silence | ✅ | ✅ added |
| Real-time audio waveform | ✅ | ✅ added (real mic data) |
| Text snippets / shortcuts | ❌ | ✅ |
| Custom vocabulary | ❌ | ✅ |
| Open source | ❌ | ✅ |

**VoiceInk beats Wispr Flow** on price, privacy, open source, Hinglish, snippets, and vocabulary.

---

## Session 1 — Bug Fixes

### Bug 1: Wrong UI Import Paths (`src/App.jsx`)
`./ui/Toast` → `./components/ui/Toast` and same for `LoadingDots` — app crashed at startup.

### Bug 2: AudioManager Recreated Every Call (`src/App.jsx`)
`new AudioManager()` inside `processAudio()` — new instance per recording, callbacks lost, memory leak.
**Fix:** Single `useRef` instance, callbacks refreshed via `setCallbacks()`.

### Bug 3: Stale Closure in IPC Toggle (`src/App.jsx`)
`isRecording`/`isProcessing` captured at registration → hotkey broke after first use.
**Fix:** `isRecordingRef`/`isProcessingRef` updated via `useEffect`; handler reads refs.

### Bug 4: Accumulating IPC Listeners (`src/App.jsx`)
Each render added another `toggle-dictation` listener with no cleanup.
**Fix:** `useEffect` returns cleanup; `preload.js` now returns a remover function.

### Bug 5: Double HotkeyManager (`main.js`)
`main.js` created its own `HotkeyManager` AND `WindowManager` creates one — double hotkey registration.
**Fix:** Removed `HotkeyManager` from `main.js` entirely.

### Bug 6: `processWithReasoningModel` Missing Parameter
Defined as `(text, context)`, called as `(text, context, hinglishMode)` → Hinglish silently dropped.
**Fix:** Added `hinglishMode = false` as third parameter.

---

## Session 2 — Improvements

### Improvement 1: hinglishMode Fully Wired End-to-End
- `audioManager.js`: `processWithReasoningModel(text, context, hinglishMode)` ✅
- `ReasoningService.js`: `processText(text, model, context, hinglishMode)` ✅
- `ReasoningService.js`: `processWithOpenAI` and `processWithAnthropic` both accept and use it ✅
- `_buildPrompt()` injects Hinglish instruction into the prompt when enabled ✅

### Improvement 2: VAD — Voice Activity Detection (`src/helpers/audioManager.js`)
Auto-stops recording after silence. Uses Web Audio `AnalyserNode`, polls RMS each animation frame.
- Default: ON, 1500ms silence threshold
- Disable: `localStorage.setItem("useVAD", "false")`
- Adjust: `localStorage.setItem("vadSilenceDuration", "2000")`

### Improvement 3: Real-Time Audio Level Monitor (`src/helpers/audioManager.js`)
`startLevelMonitor(stream, onLevel)` — emits mic amplitude (0–1) via `onStateChange` at 60fps.
`onStateChange` now passes `{ isRecording, isProcessing, audioLevel }`.

### Improvement 4: Live Waveform UI (`src/App.jsx`)
5-bar waveform reacts to real mic data (was fake CSS pulse animation).
`VoiceWaveIndicator` takes `audioLevel` prop; bar heights computed with spread coefficients.

---

## Session 3 — Correctness Fixes

### Fix 1: Hotkey Registered Twice (`main.js`)
`windowManager.createMainWindow()` already calls `initializeHotkey()` internally.
Our extra call in `startApp()` registered the hotkey a second time — double-firing.
**Fix:** Removed the redundant call from `startApp()` entirely.

### Fix 2: `onToggleDictation` Listener Never Removed (`preload.js`)
Old: `ipcRenderer.on("toggle-dictation", callback)` returned `undefined`.
`App.jsx` tried to call the returned value as cleanup but the guard `typeof cleanup === "function"` silently skipped it — listeners accumulated.
**Fix:** `preload.js` now returns `() => ipcRenderer.removeListener("toggle-dictation", callback)`.

### Fix 3: `cleanup()` Didn't Stop VAD/Level Handles (`audioManager.js`)
On unmount, VAD and level monitor `requestAnimationFrame` loops kept running.
**Fix:** `cleanup()` now calls `this._vadHandle?.stop()` and `this._levelHandle?.stop()`.

### Fix 4: `ReasoningService.processWithAnthropic` Missing hinglishMode
Was fixed in OpenAI path but Anthropic path still used old 3-arg signature and manual prompt building.
**Fix:** Both paths now use shared `_buildPrompt(text, agentName, context, hinglishMode)`.

---

## Files Changed (All Sessions)

| File | What Changed |
|---|---|
| `src/App.jsx` | Import paths, stable AudioManager ref, stale closures, IPC cleanup, audioLevel state, live waveform |
| `src/helpers/audioManager.js` | hinglishMode param, VAD, audio level monitor, cleanup() fixed |
| `src/services/ReasoningService.js` | hinglishMode wired end-to-end, `_buildPrompt()` helper, Anthropic path fixed |
| `main.js` | Removed duplicate HotkeyManager, removed redundant initializeHotkey() call |
| `preload.js` | `onToggleDictation` returns proper cleanup/remover function |
| `Claudeadj.md` | This file |

---

## Architecture: Full Audio Flow (Corrected)

```
Hotkey press → windowManager.hotkeyManager → mainWindow.webContents.send("toggle-dictation")
  → preload.js ipcRenderer → App.jsx handleToggle (via ref, never stale)
       → audioManager.startRecording()
            ├─ startLevelMonitor() → onStateChange({ audioLevel }) @ 60fps → live waveform
            ├─ startVAD() → stopRecording() after 1.5s silence
            └─ MediaRecorder.onstop → processAudio(blob)
                 ├─ processWithLocalWhisper(blob, model, context, hinglishMode)
                 │    └─ [optional] processWithReasoningModel(text, context, hinglishMode)
                 │             └─ ReasoningService.processText(text, model, context, hinglishMode)
                 │                  └─ _buildPrompt() → injects hinglish + context instructions
                 └─ processWithOpenAIAPI(blob, context, hinglishMode) [same path]
                      └─ onTranscriptionComplete → applySnippets → applyVocabulary → paste
```

## Key localStorage Settings

| Key | Default | Description |
|---|---|---|
| `useVAD` | `"true"` | Auto-stop on silence |
| `vadSilenceDuration` | `"1500"` | ms of silence before stop |
| `useLocalWhisper` | `"false"` | On-device Whisper |
| `whisperModel` | `"base"` | Whisper model size |
| `hinglishMode` | `"false"` | Hinglish transcription |
| `useReasoningModel` | `"false"` | AI text cleanup |
| `reasoningModel` | `"gpt-3.5-turbo"` | Model for cleanup |
| `preferredLanguage` | `"auto"` | Language hint |
| `allowOpenAIFallback` | `"false"` | Fallback to OpenAI if local fails |

---
*Repo: ayyushnegii/Voiceink — Claude sessions: 3*
