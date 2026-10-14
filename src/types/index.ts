export interface VideoMetadata {
  path: string;
  fileName: string;
  duration: number;
  size: number;
  bitrate: number;
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec: string;
  hasAudio: boolean;
  formatName: string;
}

export interface VideoFile extends VideoMetadata {
  id: string;
  keyframes?: number[];
  thumbnails?: { time: number; path: string }[];
}

export interface TimelineSegment {
  id: string;
  fileId: string;
  startTime: number;
  endTime: number;
  color?: string;
  label?: string;
}

export interface ExportProgress {
  jobId: string;
  percent: number;
  currentTime?: number;
  duration?: number;
  status?: string;
}

export type ExportMode = 'single_segment' | 'all_segments_separate' | 'merge_segments' | 'merge_files';

export interface ElectronAPI {
  openFileDialog: (options?: { multiple?: boolean; title?: string }) => Promise<string | string[] | null>;
  saveFileDialog: (options?: { defaultPath?: string; title?: string }) => Promise<string | null>;
  probeMedia: (filePath: string) => Promise<VideoMetadata>;
  getKeyframes: (filePath: string) => Promise<number[]>;
  generateThumbnails: (params: { filePath: string; count?: number; duration: number }) => Promise<{ time: number; path: string }[]>;
  losslessTrim: (params: { inputPath: string; outputPath: string; startTime: number; endTime: number; jobId: string }) => Promise<{ outputPath: string; success: boolean }>;
  losslessMerge: (params: { inputPaths: string[]; outputPath: string; jobId: string }) => Promise<{ outputPath: string; success: boolean }>;
  cancelJob: (jobId: string) => Promise<boolean>;
  onProgress: (callback: (data: ExportProgress) => void) => () => void;
  showItemInFolder: (filePath: string) => Promise<boolean>;
  getPlatform: () => string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
