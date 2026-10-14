import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Plus, 
  Trash2, 
  Scissors,
  Clock,
  Layers
} from 'lucide-react';
import { VideoFile, TimelineSegment } from '../types';
import { formatTime, findNearestKeyframe } from '../utils/formatters';

interface TimelineProps {
  video: VideoFile | null;
  currentTime: number;
  onSeek: (time: number) => void;
  segments: TimelineSegment[];
  activeSegmentId: string | null;
  onSelectSegment: (id: string) => void;
  onUpdateSegment: (id: string, updates: Partial<TimelineSegment>) => void;
  onDeleteSegment: (id: string) => void;
  onAddSegment: () => void;
  onSplitSegment: () => void;
  snapToKeyframes: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({
  video,
  currentTime,
  onSeek,
  segments,
  activeSegmentId,
  onSelectSegment,
  onUpdateSegment,
  onDeleteSegment,
  onAddSegment,
  onSplitSegment,
  snapToKeyframes
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 to 10
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [draggingHandle, setDraggingHandle] = useState<{ segmentId: string; type: 'start' | 'end' } | null>(null);

  const duration = video?.duration || 1;

  // Calculate pixel position from timestamp
  const timeToPercent = useCallback((time: number) => {
    return Math.min(100, Math.max(0, (time / duration) * 100));
  }, [duration]);

  // Calculate timestamp from mouse event on track
  const getTimeFromMouseEvent = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!trackRef.current || !video) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    let rawTime = (x / rect.width) * duration;

    if (snapToKeyframes && video.keyframes && video.keyframes.length > 0) {
      const nearest = findNearestKeyframe(video.keyframes, rawTime);
      const timeThreshold = (duration / rect.width) * 12; // 12px snap window
      if (Math.abs(rawTime - nearest) <= timeThreshold) {
        rawTime = nearest;
      }
    }

    return Math.max(0, Math.min(duration, rawTime));
  }, [video, duration, snapToKeyframes]);

  // Handle Scrubbing
  const handleRulerMouseDown = (e: React.MouseEvent) => {
    if (!video) return;
    setIsScrubbing(true);
    const newTime = getTimeFromMouseEvent(e);
    onSeek(newTime);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing) {
        const newTime = getTimeFromMouseEvent(e);
        onSeek(newTime);
      } else if (draggingHandle) {
        const newTime = getTimeFromMouseEvent(e);
        const targetSeg = segments.find((s) => s.id === draggingHandle.segmentId);
        if (targetSeg) {
          if (draggingHandle.type === 'start') {
            const validStart = Math.min(newTime, targetSeg.endTime - 0.1);
            onUpdateSegment(targetSeg.id, { startTime: Math.max(0, validStart) });
            onSeek(validStart);
          } else {
            const validEnd = Math.max(newTime, targetSeg.startTime + 0.1);
            onUpdateSegment(targetSeg.id, { endTime: Math.min(duration, validEnd) });
            onSeek(validEnd);
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      setDraggingHandle(null);
    };

    if (isScrubbing || draggingHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbing, draggingHandle, getTimeFromMouseEvent, onSeek, segments, onUpdateSegment, duration]);

  // Generate ticks for ruler based on duration and zoom
  const generateRulerTicks = () => {
    if (!video) return [];
    const ticks = [];
    const stepCount = Math.max(10, Math.floor(20 * zoomLevel));
    const stepInterval = duration / stepCount;

    for (let i = 0; i <= stepCount; i++) {
      const time = i * stepInterval;
      ticks.push({
        time,
        percent: (time / duration) * 100,
        label: formatTime(time, false)
      });
    }
    return ticks;
  };

  const rulerTicks = generateRulerTicks();
  const playheadPercent = timeToPercent(currentTime);

  const activeSegment = segments.find((s) => s.id === activeSegmentId);

  return (
    <div 
      ref={containerRef}
      className="h-64 bg-[#12161f] border-t border-[#212836] flex flex-col select-none"
    >
      {/* Timeline Toolbar */}
      <div className="h-10 bg-[#161c28] border-b border-[#212836] px-4 flex items-center justify-between text-xs text-gray-300">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-gray-200">Timeline</span>
            <span className="text-[11px] bg-[#212836] px-2 py-0.5 rounded text-gray-400">
              {segments.length} {segments.length === 1 ? 'Segment' : 'Segments'}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-[#2e394e]" />

          <button
            onClick={onAddSegment}
            disabled={!video}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#202838] hover:bg-[#2b374d] disabled:opacity-40 text-blue-400 rounded border border-[#2e394e] font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Segment</span>
          </button>

          <button
            onClick={onSplitSegment}
            disabled={!video}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#202838] hover:bg-[#2b374d] disabled:opacity-40 text-amber-400 rounded border border-[#2e394e] font-medium transition-colors"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Split (S)</span>
          </button>
        </div>

        {/* Selected Segment Info */}
        {activeSegment && (
          <div className="hidden md:flex items-center gap-4 text-xs font-mono bg-[#0e1219] px-3 py-1 rounded border border-[#212836]">
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3 h-3 text-blue-400" />
              <span>In: <span className="text-gray-200">{formatTime(activeSegment.startTime)}</span></span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <span>Out: <span className="text-gray-200">{formatTime(activeSegment.endTime)}</span></span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <span>Len: <span className="text-emerald-400 font-semibold">{formatTime(activeSegment.endTime - activeSegment.startTime)}</span></span>
            </div>
            <button
              onClick={() => onDeleteSegment(activeSegment.id)}
              className="text-red-400 hover:text-red-300 p-0.5 ml-1"
              title="Delete Segment"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
            className="p-1 hover:bg-[#202838] rounded text-gray-400 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-gray-400 w-8 text-center">{zoomLevel}x</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(5, z + 0.5))}
            className="p-1 hover:bg-[#202838] rounded text-gray-400 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1 hover:bg-[#202838] rounded text-gray-400 hover:text-white ml-1"
            title="Fit to Timeline"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Timeline Body (Scrollable if zoomed) */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden relative p-4 flex flex-col justify-center">
        <div 
          style={{ width: `${zoomLevel * 100}%` }}
          className="relative min-w-full h-full flex flex-col justify-between"
        >
          {/* Time Ruler */}
          <div 
            onMouseDown={handleRulerMouseDown}
            className="h-6 w-full relative border-b border-[#283245] cursor-pointer"
          >
            {rulerTicks.map((tick, i) => (
              <div
                key={i}
                style={{ left: `${tick.percent}%` }}
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
              >
                <div className="h-2 w-[1px] bg-gray-600" />
                <span className="text-[9px] font-mono text-gray-500 mt-0.5">{tick.label}</span>
              </div>
            ))}

            {/* Keyframe tick marks */}
            {video?.keyframes?.map((kf, i) => (
              <div
                key={`kf-${i}`}
                style={{ left: `${timeToPercent(kf)}%` }}
                className="absolute bottom-0 w-[1px] h-1.5 bg-amber-400/50 pointer-events-none"
                title={`Keyframe at ${formatTime(kf)}`}
              />
            ))}
          </div>

          {/* Video Clip Track Area */}
          <div
            ref={trackRef}
            onMouseDown={handleRulerMouseDown}
            className="h-24 w-full bg-[#0d1117] rounded-lg border border-[#212836] relative overflow-hidden my-auto cursor-crosshair filmstrip-stripes"
          >
            {/* Filmstrip thumbnails if available */}
            {video?.thumbnails && video.thumbnails.length > 0 && (
              <div className="absolute inset-0 flex opacity-40 pointer-events-none">
                {video.thumbnails.map((t, i) => (
                  <img
                    key={i}
                    src={`media://${encodeURIComponent(t.path)}`}
                    alt="filmstrip"
                    className="h-full flex-1 object-cover border-r border-black/40"
                  />
                ))}
              </div>
            )}

            {/* Cut Segments Overlays */}
            {segments.map((seg, idx) => {
              const startPercent = timeToPercent(seg.startTime);
              const endPercent = timeToPercent(seg.endTime);
              const widthPercent = Math.max(0.5, endPercent - startPercent);
              const isActive = seg.id === activeSegmentId;

              return (
                <div
                  key={seg.id}
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                    backgroundColor: seg.color || '#3b82f6',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSegment(seg.id);
                  }}
                  className={`absolute top-1 bottom-1 rounded-md bg-opacity-70 backdrop-blur-sm border-2 transition-all cursor-pointer flex items-center justify-between px-2 text-white font-medium ${
                    isActive ? 'border-white shadow-lg ring-2 ring-blue-500/50' : 'border-transparent hover:border-white/50'
                  }`}
                >
                  {/* Left Trim Handle (In point) */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingHandle({ segmentId: seg.id, type: 'start' });
                    }}
                    className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize bg-black/40 hover:bg-white/80 rounded-l flex items-center justify-center transition-colors group"
                    title="Drag to trim start"
                  >
                    <div className="w-0.5 h-4 bg-white/70 group-hover:bg-black rounded-full" />
                  </div>

                  {/* Segment Details & Label */}
                  <div className="text-[11px] truncate mx-3 pointer-events-none flex items-center gap-2 drop-shadow">
                    <span className="font-bold">Segment #{idx + 1}</span>
                    <span className="opacity-90 font-mono text-[10px]">
                      ({formatTime(seg.endTime - seg.startTime, false)})
                    </span>
                  </div>

                  {/* Right Trim Handle (Out point) */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingHandle({ segmentId: seg.id, type: 'end' });
                    }}
                    className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize bg-black/40 hover:bg-white/80 rounded-r flex items-center justify-center transition-colors group"
                    title="Drag to trim end"
                  >
                    <div className="w-0.5 h-4 bg-white/70 group-hover:bg-black rounded-full" />
                  </div>
                </div>
              );
            })}

            {/* Playhead Vertical Needle */}
            <div
              style={{ left: `${playheadPercent}%` }}
              className="absolute top-0 bottom-0 w-[2px] bg-red-500 pointer-events-none z-20"
            >
              <div className="w-3.5 h-3.5 bg-red-500 transform -translate-x-[6px] -translate-y-1 rotate-45 rounded-sm shadow-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
