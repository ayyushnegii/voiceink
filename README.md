# VoiceInk 🎙️

The open-source, privacy-first alternative to Wispr Flow.
100% local. No screenshots. No data leaks. Free forever.

Works in any app on Mac, Windows, and Linux.
Hindi + English + 100 more languages supported.

Built by @ayyushnegii

---

## Why VoiceInk?

Wispr Flow is the market leader in AI voice dictation but has serious problems:
- It secretly takes periodic **screenshots** of your active window without disclosing this during onboarding
- Your audio is routed through **both OpenAI and Meta** infrastructure
- Its original Terms of Service **allowed training on your dictated content** — only reversed after public backlash
- Its **Trustpilot score is 2.7/5** — most complaints are about quality degrading after the free trial ends
- **iPad + Linux support is broken or nonexistent**
- It is **closed-source, cloud-dependent, and expensive**
- It completely **ignores Hindi and regional Indian languages** — a massive untapped market

VoiceInk fills this gap: a tool that is 100% local, fully transparent, free forever, and built with Indian language support from day one.

## Features

### Phase 1 — Core (MVP)
- **Global hotkey → record → transcribe → inject** into any active text field system-wide
- **Local Whisper model support** — tiny, base, small, medium, large, turbo — no API key needed
- **Model manager UI** — download, switch, and delete local models in one click
- **Auto text injection** — paste transcribed text directly into whatever app is focused
- **Transcription history panel** — searchable log of everything dictated, stored locally

### Phase 2 — Intelligence Layer
- **AI cleanup layer** — remove filler words, fix punctuation, auto-format
- **Context-aware tone adjustment** — detect active window title to adjust output tone
- **Voice snippets/shortcuts** — user-defined trigger words for quick text insertion
- **Custom vocabulary** — add names, brand names, jargon for better accuracy

### Phase 3 — Differentiation (What beats Wispr Flow)
- **Hindi + Hinglish support** — automatic language detection mid-sentence
- **Privacy Dashboard** — real-time view of where audio is processed
- **Whisper mode** — low-volume dictation with accurate transcription
- **Offline mode badge** — clear visual indicator when running 100% offline
- **BYOK (Bring Your Own Key)** — optional cloud speed with your own API keys

### Phase 4 — Polish
- **Onboarding wizard** — first-run setup experience
- **Settings page** — full customization options
- **System tray integration** — always accessible from menu bar/taskbar
- **Dark/light mode** — respects system preference
- **Linux AppImage + DEB build** — first dictation tool to properly support Linux

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron (cross-platform: Mac, Windows, Linux) |
| Frontend UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui components |
| Local STT | OpenAI Whisper (tiny/base/small/medium/large/turbo) |
| Fast STT | NVIDIA Parakeet (optional, for GPU users) |
| Cloud STT (BYOK) | Groq Whisper API (user provides own key) |
| AI cleanup | Anthropic Claude API or OpenAI (BYOK, optional) |
| Python bridge | whisper_bridge.py (local model runner) |
| Local database | better-sqlite3 (transcription history, vocabulary, snippets) |
| Global hotkey | Customizable, default: backtick ` |
| Build system | Vite + Electron Builder |

## Anti-Wispr-Flow Principles

We will **NEVER**:
- Take screenshots of your screen — use active window title only for context
- Send audio to third parties without explicit per-session user consent
- Require an account to use any core feature
- Degrade quality — open source, no trial, no paywalls on core features
- Store audio files — only the final transcribed text (and only locally)
- Send usage data without opt-in

## Getting Started

1. Clone the repo: `git clone https://github.com/ayyushnegii/voiceink.git`
2. Install dependencies: `npm install`
3. Run in dev mode: `npm run dev`
4. First run will trigger the onboarding wizard

## Contributing

Contributions are welcome! Please read our contributing guidelines and open issues for feature requests or bug reports.

## License

MIT License — free to use, modify, and distribute.