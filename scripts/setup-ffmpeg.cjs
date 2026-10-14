/**
 * Helper script to ensure FFmpeg and FFprobe binaries are present in bin/win-x64
 * for development, local testing, and packaging for the Microsoft Store.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const targetDir = path.join(__dirname, '..', 'bin', 'win-x64');

console.log('--- Lossless Studio: FFmpeg Environment Setup ---');
console.log(`Target directory: ${targetDir}`);

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const ffmpegExe = path.join(targetDir, 'ffmpeg.exe');
const ffprobeExe = path.join(targetDir, 'ffprobe.exe');

// Check if binaries are already present
if (fs.existsSync(ffmpegExe) && fs.existsSync(ffprobeExe)) {
  console.log('✅ FFmpeg and FFprobe binaries already exist in bin/win-x64');
  process.exit(0);
}

console.log('Checking system PATH for ffmpeg and ffprobe...');
try {
  const systemFfmpeg = execSync('where ffmpeg.exe', { encoding: 'utf8' }).trim().split('\n')[0].trim();
  const systemFfprobe = execSync('where ffprobe.exe', { encoding: 'utf8' }).trim().split('\n')[0].trim();

  if (systemFfmpeg && systemFfprobe) {
    console.log(`Found system FFmpeg at: ${systemFfmpeg}`);
    console.log(`Found system FFprobe at: ${systemFfprobe}`);
    fs.copyFileSync(systemFfmpeg, ffmpegExe);
    fs.copyFileSync(systemFfprobe, ffprobeExe);
    console.log('✅ Copied system binaries to local project bin/ folder for packaging.');
    process.exit(0);
  }
} catch (e) {
  console.log('System FFmpeg was not found in PATH or could not be copied automatically.');
  console.log('\nTo bundle FFmpeg with your Microsoft Store build:');
  console.log('1. Download official Windows static build from https://www.gyan.dev/ffmpeg/builds/ (ffmpeg-release-essentials.zip)');
  console.log('2. Place "ffmpeg.exe" and "ffprobe.exe" into:');
  console.log(`   ${targetDir}\n`);
}
