const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

// In packaged Electron apps, binaries must be executed from app.asar.unpacked
const fixAsarPath = (binaryPath) => {
  if (!binaryPath) return binaryPath;
  return binaryPath.replace('app.asar', 'app.asar.unpacked');
};

const ffmpegPath = fixAsarPath(ffmpegInstaller.path);
const ffprobePath = fixAsarPath(ffprobeInstaller.path);

// Configure fluent-ffmpeg to use the npm-managed binaries
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

class FFmpegEngine {
  constructor() {
    this.activeCommands = new Map();
  }

  // Probe media using fluent-ffmpeg's built-in ffprobe
  async probeMedia(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, data) => {
        if (err) {
          return reject(new Error(`ffprobe failed: ${err.message}`));
        }

        try {
          const videoStream = data.streams?.find((s) => s.codec_type === 'video');
          const audioStream = data.streams?.find((s) => s.codec_type === 'audio');

          let fps = 30;
          if (videoStream?.r_frame_rate) {
            const parts = videoStream.r_frame_rate.split('/');
            if (parts.length === 2 && Number(parts[1]) > 0) {
              fps = Number(parts[0]) / Number(parts[1]);
            }
          }

          const duration = Number(data.format?.duration || videoStream?.duration || 0);

          resolve({
            path: filePath,
            fileName: path.basename(filePath),
            duration,
            size: Number(data.format?.size || 0),
            bitrate: Number(data.format?.bit_rate || 0),
            width: videoStream?.width || 1920,
            height: videoStream?.height || 1080,
            fps: Math.round(fps * 100) / 100,
            videoCodec: videoStream?.codec_name || 'unknown',
            audioCodec: audioStream?.codec_name || 'unknown',
            hasAudio: !!audioStream,
            formatName: data.format?.format_name || '',
          });
        } catch (e) {
          reject(new Error(`Failed to parse media metadata: ${e.message}`));
        }
      });
    });
  }

  // Extract keyframe timestamps using ffprobe binary
  async getKeyframes(filePath) {
    return new Promise((resolve) => {
      const args = [
        '-select_streams', 'v',
        '-show_frames',
        '-show_entries', 'frame=pkt_pts_time,key_frame',
        '-of', 'csv=p=0',
        filePath,
      ];

      const keyframes = [];
      const proc = spawn(ffprobePath, args);
      let buffer = '';

      proc.stdout.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          const parts = line.trim().split(',');
          if (parts.length >= 2 && parts[1] === '1') {
            const time = parseFloat(parts[0]);
            if (!isNaN(time)) keyframes.push(time);
          }
        }
      });

      proc.on('close', () => resolve(keyframes));
      proc.on('error', () => resolve([]));
    });
  }

  // Generate thumbnail previews using fluent-ffmpeg
  async generateThumbnails({ filePath, count = 10, duration, outputDir }) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const interval = duration / (count + 1);
    const thumbnails = [];

    for (let i = 1; i <= count; i++) {
      const timestamp = (i * interval).toFixed(2);
      const outName = `thumb_${path.basename(filePath, path.extname(filePath))}_${i}.jpg`;
      const outPath = path.join(outputDir, outName);

      await new Promise((res) => {
        ffmpeg(filePath)
          .seekInput(parseFloat(timestamp))
          .frames(1)
          .size('160x?')
          .output(outPath)
          .on('end', () => res(outPath))
          .on('error', () => res(null))
          .run();
      });

      if (fs.existsSync(outPath)) {
        thumbnails.push({ time: parseFloat(timestamp), path: outPath });
      }
    }

    return thumbnails;
  }

  // Lossless Trimming via fluent-ffmpeg with stream copy (-c copy)
  losslessTrim({ inputPath, outputPath, startTime, endTime, jobId, onProgress }) {
    return new Promise((resolve, reject) => {
      const duration = endTime - startTime;

      const command = ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .outputOptions([
          '-c copy',
          '-avoid_negative_ts make_zero',
          '-map 0',
        ])
        .output(outputPath)
        .on('progress', (progress) => {
          if (onProgress && duration > 0) {
            let percent = 0;
            if (progress.timemark) {
              const parts = progress.timemark.split(':');
              const secs = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
              percent = Math.min(100, Math.max(0, Math.round((secs / duration) * 100)));
            }
            onProgress({ jobId, percent, currentTime: progress.targetSize, duration });
          }
        })
        .on('end', () => {
          this.activeCommands.delete(jobId);
          resolve({ outputPath, success: true });
        })
        .on('error', (err) => {
          this.activeCommands.delete(jobId);
          reject(new Error(`fluent-ffmpeg trim error: ${err.message}`));
        });

      this.activeCommands.set(jobId, command);
      command.run();
    });
  }

  // Lossless Concat / Merge via fluent-ffmpeg concat demuxer
  async losslessMerge({ inputPaths, outputPath, jobId, onProgress }) {
    if (!inputPaths || inputPaths.length === 0) {
      throw new Error('No input files provided for merge.');
    }

    const tempDir = os.tmpdir();
    const concatListPath = path.join(tempDir, `lossless_concat_${Date.now()}.txt`);

    const listContent = inputPaths
      .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
      .join('\n');

    fs.writeFileSync(concatListPath, listContent, 'utf8');

    return new Promise((resolve, reject) => {
      const command = ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c copy'])
        .output(outputPath)
        .on('progress', (progress) => {
          if (onProgress) {
            onProgress({ jobId, status: 'merging', rawTime: progress.timemark });
          }
        })
        .on('end', () => {
          this.activeCommands.delete(jobId);
          try {
            if (fs.existsSync(concatListPath)) fs.unlinkSync(concatListPath);
          } catch (_) {}
          resolve({ outputPath, success: true });
        })
        .on('error', (err) => {
          this.activeCommands.delete(jobId);
          try {
            if (fs.existsSync(concatListPath)) fs.unlinkSync(concatListPath);
          } catch (_) {}
          reject(new Error(`fluent-ffmpeg merge error: ${err.message}`));
        });

      this.activeCommands.set(jobId, command);
      command.run();
    });
  }

  cancelJob(jobId) {
    if (this.activeCommands.has(jobId)) {
      const cmd = this.activeCommands.get(jobId);
      try {
        cmd.kill('SIGKILL');
      } catch (_) {}
      this.activeCommands.delete(jobId);
      return true;
    }
    return false;
  }
}

module.exports = new FFmpegEngine();
