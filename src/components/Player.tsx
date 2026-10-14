import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Volume2, 
  VolumeX, 
  Maximize2,
  Bookmark,
  Target,
  AlertTriangle
} from 'lucide-react';
import { VideoFile } from '../types';
import { formatTime, findNearestKeyframe } from '../utils/formatters';

interface PlayerProps {
  video: VideoFile | null;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onSetInPoint: (time: number) => void;
  onSetOutPoint: (time: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  snapToKeyframes: boolean;
  setSnapToKeyframes: (snap: boolean) => void;
}

export const Player: React.FC<PlayerProps> = ({
  video,
  currentTime,
  onTimeUpdate,
  onSetInPoint,
  onSetOutPoint,
  isPlaying,
  setIsPlaying,
  snapToKeyframes,
  setSnapToKeyframes
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [useProtocolFallback, setUseProtocolFallback] = useState<boolean>(false);

  // Synchronize external currentTime updates with the video element
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.05) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Synchronize playback state
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch(() => setIsPlaying(false));
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, setIsPlaying]);

  const togglePlay = useCallback(() => {
    if (!video) return;
    setIsPlaying(!isPlaying);
  }, [video, isPlaying, setIsPlaying]);

  const stepFrame = (forward = true) => {
    if (!video || !videoRef.current) return;
    setIsPlaying(false);
    const frameDuration = 1 / (video.fps || 30);
    const newTime = forward 
      ? Math.min(video.duration, currentTime + frameDuration)
      : Math.max(0, currentTime - frameDuration);
    onTimeUpdate(newTime);
  };

  const stepSeconds = (seconds: number) => {
    if (!video || !videoRef.current) return;
    const newTime = Math.max(0, Math.min(video.duration, currentTime + seconds));
    onTimeUpdate(newTime);
  };

  const jumpToKeyframe = (forward = true) => {
    if (!video || !video.keyframes || video.keyframes.length === 0) return;
    let target = currentTime;
    if (forward) {
      const next = video.keyframes.find((k) => k > currentTime + 0.05);
      if (next !== undefined) target = next;
    } else {
      const prevList = video.keyframes.filter((k) => k < currentTime - 0.05);
      if (prevList.length > 0) target = prevList[prevList.length - 1];
    }
    onTimeUpdate(target);
  };

  const handleSnapToNearestKeyframe = () => {
    if (!video || !video.keyframes) return;
    const nearest = findNearestKeyframe(video.keyframes, currentTime);
    onTimeUpdate(nearest);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  useEffect(() => {
    setPlaybackRate(1);
    setVideoError(null);
    setUseProtocolFallback(false);
  }, [video?.path]);

  // Robust URL generation: primary file://, fallback to media:// protocol
  const videoSrc = useMemo(() => {
    if (!video?.path) return '';
    if (useProtocolFallback) {
      return `media://local/?path=${encodeURIComponent(video.path)}`;
    }
    const normalized = video.path.replace(/\\/g, '/');
    return normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`;
  }, [video?.path, useProtocolFallback]);

  const currentFrame = video?.fps ? Math.floor(currentTime * video.fps) : 0;

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex flex-col bg-[#0b0e14] relative overflow-hidden select-none"
    >
      {/* Video Viewport */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {video ? (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              className={`max-h-full max-w-full object-contain ${videoError ? 'hidden' : 'block'}`}
              onTimeUpdate={() => {
                if (videoRef.current && isPlaying) {
                  onTimeUpdate(videoRef.current.currentTime);
                }
              }}
              onLoadedData={() => setVideoError(null)}
              onEnded={() => setIsPlaying(false)}
              onError={() => {
                if (!useProtocolFallback) {
                  setUseProtocolFallback(true);
                } else {
                  setVideoError(
                    `This video format/codec (${video.videoCodec || 'unknown'} / ${video.audioCodec || 'unknown'}) cannot be decoded directly by the built-in browser player. Lossless trimming & merging via FFmpeg will still work 100%!`
                  );
                }
              }}
              onClick={togglePlay}
            />

            {videoError && (
              <div className="max-w-md p-6 bg-[#161d2a]/95 border border-amber-500/30 rounded-xl text-center space-y-3 m-4 shadow-xl">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                <h4 className="text-sm font-semibold text-gray-200">Preview Unsupported in Browser Player</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{videoError}</p>
                <div className="text-[11px] font-mono bg-black/40 p-2 rounded text-gray-300">
                  Codec: {video.videoCodec} | Audio: {video.audioCodec} | Format: {video.formatName}
                </div>
                <p className="text-[11px] text-emerald-400 font-medium">
                  💡 You can still set In/Out points using timestamps and Export Losslessly!
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-500 gap-3">
            <RotateCcw className="w-12 h-12 stroke-[1.2] opacity-40 animate-pulse" />
            <p className="text-sm font-medium">No video loaded. Click "Add Video" or drag and drop a file.</p>
          </div>
        )}

        {/* Floating Timecode HUD */}
        {video && (
          <div className="absolute top-4 left-4 bg-black/75 backdrop-blur border border-white/10 px-3 py-1.5 rounded-md flex items-center gap-3 text-xs font-mono">
            <span className="text-blue-400 font-semibold">{formatTime(currentTime)}</span>
            <span className="text-gray-500">/</span>
            <span className="text-gray-400">{formatTime(video.duration)}</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-300">F: {currentFrame}</span>
          </div>
        )}
      </div>

      {/* Playback Controls Bar */}
      <div className="h-12 bg-[#12161f] border-t border-[#212836] px-4 flex items-center justify-between text-xs text-gray-300">
        {/* Left: Trim Markers & Keyframe tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSetInPoint(currentTime)}
            disabled={!video}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#1b2230] hover:bg-[#252f42] disabled:opacity-40 text-blue-400 rounded border border-[#2e394e] font-medium transition-colors"
            title="Set In Point / Start Cut ([ or I)"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Mark In [I]</span>
          </button>
          <button
            onClick={() => onSetOutPoint(currentTime)}
            disabled={!video}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#1b2230] hover:bg-[#252f42] disabled:opacity-40 text-blue-400 rounded border border-[#2e394e] font-medium transition-colors"
            title="Set Out Point / End Cut (] or O)"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Mark Out [O]</span>
          </button>

          <div className="h-4 w-[1px] bg-[#2e394e] mx-1" />

          <button
            onClick={handleSnapToNearestKeyframe}
            disabled={!video}
            className="flex items-center gap-1 px-2 py-1 bg-[#1b2230] hover:bg-[#252f42] disabled:opacity-40 text-amber-400 rounded border border-[#2e394e] transition-colors"
            title="Snap playhead to nearest I-Frame / Keyframe (K)"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Keyframe Snap</span>
          </button>

          <label className="flex items-center gap-1.5 text-[11px] text-gray-400 ml-1 cursor-pointer">
            <input
              type="checkbox"
              checked={snapToKeyframes}
              onChange={(e) => setSnapToKeyframes(e.target.checked)}
              className="rounded bg-[#1b2230] border-gray-600 text-blue-500 focus:ring-0"
            />
            <span>Auto-snap Keyframes</span>
          </label>
        </div>

        {/* Center: Transport Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => jumpToKeyframe(false)}
            disabled={!video}
            className="p-1.5 hover:bg-[#1f2637] rounded text-gray-400 hover:text-white disabled:opacity-30"
            title="Previous Keyframe"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => stepSeconds(-1)}
            disabled={!video}
            className="p-1.5 hover:bg-[#1f2637] rounded text-gray-400 hover:text-white disabled:opacity-30"
            title="Back 1 Second (Shift+Left)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => stepFrame(false)}
            disabled={!video}
            className="px-1.5 py-1 hover:bg-[#1f2637] rounded text-[11px] font-mono text-gray-400 hover:text-white disabled:opacity-30"
            title="Back 1 Frame (Left Arrow)"
          >
            -1F
          </button>

          <button
            onClick={togglePlay}
            disabled={!video}
            className="mx-2 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-full transition-transform active:scale-95"
            title="Play/Pause (Space)"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => stepFrame(true)}
            disabled={!video}
            className="px-1.5 py-1 hover:bg-[#1f2637] rounded text-[11px] font-mono text-gray-400 hover:text-white disabled:opacity-30"
            title="Forward 1 Frame (Right Arrow)"
          >
            +1F
          </button>
          <button
            onClick={() => stepSeconds(1)}
            disabled={!video}
            className="p-1.5 hover:bg-[#1f2637] rounded text-gray-400 hover:text-white disabled:opacity-30"
            title="Forward 1 Second (Shift+Right)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => jumpToKeyframe(true)}
            disabled={!video}
            className="p-1.5 hover:bg-[#1f2637] rounded text-gray-400 hover:text-white disabled:opacity-30"
            title="Next Keyframe"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Audio Volume, Speed & Fullscreen */}
        <div className="flex items-center gap-3">
          {/* Speed Selector */}
          <select
            value={playbackRate}
            onChange={(e) => {
              const r = parseFloat(e.target.value);
              setPlaybackRate(r);
              if (videoRef.current) videoRef.current.playbackRate = r;
            }}
            className="bg-[#1b2230] text-gray-300 border border-[#2e394e] rounded px-1.5 py-0.5 text-[11px] outline-none"
          >
            <option value="0.25">0.25x</option>
            <option value="0.5">0.5x</option>
            <option value="1">1.0x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2.0x</option>
          </select>

          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (videoRef.current) {
                  const newMuted = !isMuted;
                  setIsMuted(newMuted);
                  videoRef.current.muted = newMuted;
                }
              }}
              className="text-gray-400 hover:text-white"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                setIsMuted(val === 0);
                if (videoRef.current) {
                  videoRef.current.volume = val;
                  videoRef.current.muted = val === 0;
                }
              }}
              className="w-16 h-1 bg-[#2e394e] rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <button
            onClick={toggleFullscreen}
            className="text-gray-400 hover:text-white p-1 rounded"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
