# Lossless Studio - Lossless Video Editor (Trimmer & Merger)

A fast, lossless video editor and merger built with **React**, **Electron**, and **FFmpeg**. Designed for high-speed cutting without quality loss (stream copying) and packaged for direct launch in the **Microsoft Store**.

![UI Preview](build-assets/preview.png)

---

## ⚡ Core Features

- **0% Quality Loss (Direct Stream Copy)**: Uses FFmpeg `-c copy` to extract segments and concatenate videos in seconds without re-encoding, preserving original bitrates, colors, HDR, and audio fidelity.
- **Precision Trimmer & Multi-Segment Editing**:
  - Interactive multi-segment timeline.
  - Draggable In/Out trim handles.
  - Split cuts anywhere on the timeline (`S` key).
  - Combine multiple cut segments back into one clean file or export them separately.
- **Lossless Video Merger**:
  - Load multiple videos into the Media Bin.
  - Reorder clips with arrow buttons.
  - Merge all clips seamlessly into a single file with zero transcoding delay.
- **Keyframe (I-Frame) Snapping**:
  - Automatically identifies video keyframe packets using `ffprobe`.
  - Visual keyframe tick marks along the timeline ruler.
  - Snap-to-keyframe toggle ensures glitch-free cuts.
- **Non-Linear Interactive Timeline**:
  - Real-time scrubber and playhead.
  - 1x to 5x Timeline zoom.
  - Precise timecode display (`HH:MM:SS.mmm`) and frame counter (`F: 120`).
  - Frame stepping forward/backward (`+1F`, `-1F`).
- **Microsoft Store Ready**:
  - Configured with `electron-builder` for MSIX / AppX packaging.
  - Windows full-trust capability for FFmpeg binary isolation.

---

## 📂 Project Structure

```
lossless-video-editor/
├── bin/
│   └── win-x64/                # Bundled FFmpeg & FFprobe binaries
├── electron/
│   ├── main.cjs                # Electron Main process & custom media streaming
│   ├── preload.cjs             # Secure Context Bridge
│   └── ffmpeg-engine.cjs       # FFmpeg stream-copy & probe engine
├── src/
│   ├── components/
│   │   ├── Header.tsx          # App header & top actions
│   │   ├── Player.tsx          # Video player with transport controls
│   │   ├── Timeline.tsx        # Zoomable ruler & draggable cut handles
│   │   ├── MediaBin.tsx        # File list, codec inspect & merger reorder
│   │   ├── ExportModal.tsx     # Lossless export & real-time progress
│   │   └── ShortcutsModal.tsx  # Keyboard shortcuts & guide
│   ├── utils/
│   │   └── formatters.ts       # Timecode, size & keyframe calculators
│   ├── types/
│   │   └── index.ts            # Data models & Electron IPC types
│   ├── App.tsx                 # Main application controller
│   ├── index.css               # Tailwind CSS & timeline styling
│   └── main.tsx                # React entry
├── electron-builder.json       # Microsoft Store (AppX/MSIX) build profile
├── package.json
└── MICROSOFT_STORE_GUIDE.md    # Microsoft Partner Center launch roadmap
```

---

## 🚀 Quick Start Guide

### 1. Install Node.js
If not already installed on your machine, download and install Node.js from [nodejs.org](https://nodejs.org) (v18+ recommended).

### 2. Set Up FFmpeg Binaries
Ensure `ffmpeg.exe` and `ffprobe.exe` are placed in `bin/win-x64/`:
1. Download `ffmpeg-release-essentials.zip` from [Gyan.dev](https://www.gyan.dev/ffmpeg/builds/).
2. Extract and copy `ffmpeg.exe` and `ffprobe.exe` into:
   ```
   C:\Users\chand\.gemini\antigravity\scratch\lossless-video-editor\bin\win-x64\
   ```

### 3. Install Dependencies
Open PowerShell inside the project directory:
```powershell
cd C:\Users\chand\.gemini\antigravity\scratch\lossless-video-editor
npm install
```

### 4. Run in Development Mode
```powershell
npm run electron:dev
```
This launches Vite at `http://localhost:5173` and boots Electron simultaneously with Hot Module Replacement (HMR).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause Video |
| `I` or `[` | Mark Cut In Point (Start of Segment) |
| `O` or `]` | Mark Cut Out Point (End of Segment) |
| `S` or `C` | Split Segment at Playhead |
| `K` | Snap Playhead to nearest Keyframe |
| `Left` / `Right` | Step backward / forward by 1 Frame |
| `Shift` + `Left` / `Right` | Step backward / forward by 1 Second |
| `Ctrl` + `O` | Add Video File(s) |
| `Ctrl` + `E` | Open Export Modal |

---

## 🏪 Packaging for Microsoft Store

To create the `.appx` / `.msix` package ready for submission to Microsoft Partner Center:

1. Update your Publisher ID and Identity in `electron-builder.json`.
2. Run:
   ```powershell
   npm run pack:appx
   ```
3. Your store package will be generated in `release/`.

See [MICROSOFT_STORE_GUIDE.md](file:///C:/Users/chand/.gemini/antigravity/scratch/lossless-video-editor/MICROSOFT_STORE_GUIDE.md) for complete details.
