# Microsoft Store Launch Guide: Lossless Video Editor

This step-by-step roadmap walks you through preparing, packaging, and publishing your React + Electron + FFmpeg Lossless Video Editor to the **Microsoft Store**.

---

## 1. Prerequisites

1. **Microsoft Partner Center Account**:
   - Register at [partner.microsoft.com](https://partner.microsoft.com/dashboard).
   - An individual developer account has a small one-time fee (~$19 USD).
2. **Node.js (v18+) & NPM**:
   - Install from [nodejs.org](https://nodejs.org).

---

## 2. Setting Up Partner Center Identity

1. In **Partner Center**, navigate to **Apps and games** > **New product** > **MSIX or PWA app**.
2. Reserve your app name (e.g., `Lossless Studio: Video Trimmer & Merger`).
3. Go to **Product management** > **Product Identity**.
4. Note down the following 3 fields:
   - **Package/Identity name** (e.g., `12345YourName.LosslessStudio`)
   - **Publisher** (e.g., `CN=ABCDEF12-3456-7890-ABCD-1234567890AB`)
   - **Publisher display name** (e.g., `Your Studio Name`)

5. Update `electron-builder.json` with these exact values:
   ```json
   "appx": {
     "identityName": "12345YourName.LosslessStudio",
     "publisher": "CN=ABCDEF12-3456-7890-ABCD-1234567890AB",
     "publisherDisplayName": "Your Studio Name",
     "customCapabilities": ["runFullTrust"]
   }
   ```

---

## 3. Bundling FFmpeg for Microsoft Store Sandboxing

In Microsoft Store packaged apps (MSIX/AppX), apps run in a container. To ensure child processes like FFmpeg and FFprobe run without path errors:

1. Download the static Windows build from [Gyan.dev FFmpeg Builds](https://www.gyan.dev/ffmpeg/builds/) (choose `ffmpeg-release-essentials.zip`).
2. Extract and place:
   - `ffmpeg.exe`
   - `ffprobe.exe`
   into the folder:
   ```
   lossless-video-editor/bin/win-x64/
   ```
3. Our `electron-builder.json` is configured with `extraResources` to package this folder into `resources/bin/`, which `electron/ffmpeg-engine.cjs` automatically detects at runtime.

---

## 4. Microsoft Store Asset Requirements

Store packages require specific PNG icons inside `build-assets/appx/`:
- `StoreLogo.png` (50 x 50 px)
- `Square44x44Logo.png` (44 x 44 px)
- `Square150x150Logo.png` (150 x 150 px)
- `Wide310x150Logo.png` (310 x 150 px)

Also provide an `icon.ico` (256x256 multi-size ICO) in `build-assets/icon.ico`.

---

## 5. Building the Microsoft Store Package (.appx / .msix)

Run the packaging command:
```powershell
npm run pack:appx
```

`electron-builder` will generate:
- `release/Lossless Studio 1.0.0.appx` (or `.appxupload`)

> **Note on Code Signing for Store Submission:**
> You **do not need** to purchase an expensive EV code signing certificate. Microsoft automatically signs your package with Microsoft's trusted root certificate when it passes Store Certification.

---

## 6. Testing the AppX Package Locally Before Submitting

To test your generated `.appx` locally on your Windows PC:
1. Enable **Developer Mode** in Windows:
   - Settings > System > For developers > Turn on **Developer Mode**.
2. If self-signing locally, `electron-builder` will create a test certificate (`.pfx`) if configured, or you can run `npm run electron:dev` to test all functionality directly.

---

## 7. Submitting to Partner Center

1. In Partner Center, click **Start your submission**.
2. **Pricing and availability**: Set free or paid, select markets (e.g. Worldwide).
3. **Properties**: Category `Photo & video`, Subcategory `Video`.
4. **Age ratings**: Complete the IARC questionnaire (typically all-ages suitable).
5. **Packages**: Upload the `.appx` file from the `release/` folder.
6. **Store listings**:
   - Description, Feature bullet points, Search keywords (`video trimmer`, `lossless cut`, `video merger`, `ffmpeg`).
   - Upload at least 1 high-resolution screenshot (1920x1080).
   - Privacy Policy link.
7. Click **Submit to the Store**. Review usually completes within 24 to 72 hours.
