# Claudeadj — VoiceInk Bug Fixes & Improvements

> Documented by Claude. All fixes applied directly to the codebase.

---

## Bugs Fixed

### 1. Wrong UI Component Import Paths (`src/App.jsx`)
- **Bug:** `import { useToast } from "./ui/Toast"` and `import { LoadingDots } from "./ui/LoadingDots"` — paths missing `/components/` segment → app crashes at startup with module-not-found error.
- **Fix:** Corrected to `./components/ui/Toast` and `./components/ui/LoadingDots`.

### 2. AudioManager Recreated on Every `processAudio()` Call (`src/App.jsx`)
- **Bug:** `const audioManager = new AudioManager()` inside `processAudio()` — a brand-new instance is created every recording. Callbacks (onStateChange, onError, onTranscriptionComplete) are lost; state is reset; memory leaks from orphaned instances.
- **Fix:** Moved to a stable `useRef`. A single instance is created once; callbacks are refreshed via `setCallbacks()` before each use via `getAudioManager()`.

### 3. Stale Closure in IPC Toggle Handler (`src/App.jsx`)
- **Bug:** `isRecording` and `isProcessing` captured at registration time in the `useEffect` that wires up `onToggleDictation` — after the first toggle, the values are forever stale, so the global hotkey misbehaves.
- **Fix:** Added `isRecordingRef` and `isProcessingRef` (updated via `useEffect` on every state change). IPC handler reads refs, never stale state. `useEffect` for IPC registration has empty deps `[]` — correct and intentional.

### 4. Memory Leak — Accumulating IPC Listeners (`src/App.jsx`)
- **Bug:** Every re-render (or every call to the effect) added a new `ipcRenderer.on('toggle-dictation')` listener without removing the old one.
- **Fix:** Effect now returns a cleanup function. `window.electronAPI.onToggleDictation` returns a remover which is called on cleanup.

### 5. Double HotkeyManager Instantiation (`main.js`)
- **Bug:** `main.js` called `new HotkeyManager()` AND `WindowManager` also internally creates `new HotkeyManager()`. Both registered global hotkeys → conflicts, double-firing, unpredictable behavior.
- **Fix:** Removed `HotkeyManager` import and instantiation from `main.js`. All hotkey management goes through `windowManager.initializeHotkey()` which uses `WindowManager`'s internal instance.

### 6. `processWithReasoningModel` Parameter Mismatch (`src/helpers/audioManager.js`)
- **Bug:** Function defined as `processWithReasoningModel(text, context = null)` (2 params) but called as `processWithReasoningModel(text, context, hinglishMode)` (3 params) on lines 201 & 445. `hinglishMode` was silently dropped → Hinglish mode never applied via reasoning model path.
- **Fix:** Added `hinglishMode = false` as third parameter to the function signature.

---

## Improvements Made

### Stable AudioManager Pattern
The new `getAudioManager()` pattern using `useRef` is more robust than recreating instances. Callbacks are always fresh. Instance is cleaned up on component unmount.

### Ref-Mirrored State for IPC/Event Handlers
Pattern of `const xRef = useRef(); useEffect(() => { xRef.current = x; }, [x])` is now used for `isRecording` and `isProcessing`. This is the correct React pattern for values that need to be read inside event handlers or IPC callbacks registered once.

---

## Files Changed

| File | Changes |
|------|---------|
| `src/App.jsx` | Import paths, stable AudioManager ref, stale closure fix, IPC cleanup |
| `src/helpers/audioManager.js` | `processWithReasoningModel` 3rd param added |
| `main.js` | Removed duplicate HotkeyManager, use windowManager's instead |

---

*Applied: VoiceInk repo — ayyushnegii/Voiceink*
