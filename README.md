<div align="center">

# 🎙️ VoiceInk

**AI-powered voice transcription — offline, private, and blazing fast.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://github.com/ayyushnegii/voiceink/releases)
[![Node](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)

</div>

---

## What is VoiceInk?

VoiceInk is a desktop app that transcribes your voice in real time using **Whisper AI** — entirely on your device. No cloud. No subscriptions. Your audio never leaves your machine.

## Features

- 🔒 **100% offline** — Whisper runs locally via Python bridge
- ⚡ **Real-time transcription** with low latency
- 🖥️ **Cross-platform** — Electron app for Windows, macOS, Linux
- 📋 **One-click copy** to clipboard
- 🎚️ **Model selection** — choose speed vs accuracy tradeoff

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Shell | Electron + Node.js |
| AI Engine | OpenAI Whisper (local) |
| Bridge | Python (`whisper_bridge.py`) |
| Packaging | electron-builder |

## Quick Start

```bash
# Prerequisites: Node 18+, Python 3.9+, pip
git clone https://github.com/ayyushnegii/voiceink.git
cd voiceink
npm install
pip install openai-whisper
npm start
```

See [LOCAL_WHISPER_SETUP.md](LOCAL_WHISPER_SETUP.md) for GPU acceleration setup.

## Project Structure

```
voiceink/
├── src/           # Renderer (UI)
├── scripts/       # Build & setup scripts
├── main.js        # Electron main process
├── preload.js     # Context bridge
└── whisper_bridge.py  # Python ↔ Electron bridge
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Issues and PRs welcome.

## License

MIT © [Ayush Negi](https://github.com/ayyushnegii)
