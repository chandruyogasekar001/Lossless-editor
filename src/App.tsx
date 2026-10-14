import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Player } from './components/Player';
import { Timeline } from './components/Timeline';
import { MediaBin } from './components/MediaBin';
import { ExportModal } from './components/ExportModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { VideoFile, TimelineSegment, ExportMode, ExportProgress } from './types';
import { getRandomColor, findNearestKeyframe } from './utils/formatters';

export function App() {
  const [files, setFiles] = useState<VideoFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [snapToKeyframes, setSnapToKeyframes] = useState<boolean>(true);

  // Timeline Segments for active video
  const [segments, setSegments] = useState<TimelineSegment[]>([]);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  // Modals and Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportedPath, setExportedPath] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const activeVideo = useMemo(
    () => files.find((f) => f.id === activeFileId) || null,
    [files, activeFileId]
  );

  // Listen for background progress events from FFmpeg
  useEffect(() => {
    if (!window.electronAPI) return;
    const unsubscribe = window.electronAPI.onProgress((data) => {
      setExportProgress(data);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // When active video changes, initialize default segment spanning full duration
  useEffect(() => {
    if (activeVideo) {
      const initialSeg: TimelineSegment = {
        id: `seg_${Date.now()}_1`,
        fileId: activeVideo.id,
        startTime: 0,
        endTime: activeVideo.duration,
        color: getRandomColor(0),
        label: 'Segment 1'
      };
      setSegments([initialSeg]);
      setActiveSegmentId(initialSeg.id);
      setCurrentTime(0);
      setIsPlaying(false);
    } else {
      setSegments([]);
      setActiveSegmentId(null);
    }
  }, [activeFileId]);

  // Handle Importing Video Files
  const handleOpenFiles = async () => {
    if (!window.electronAPI) {
      alert('Running in browser mode. In Electron, this opens native Windows file picker.');
      return;
    }

    try {
      const result = await window.electronAPI.openFileDialog({ multiple: true });
      if (!result) return;

      const paths = Array.isArray(result) ? result : [result];
      const newFiles: VideoFile[] = [];

      for (const p of paths) {
        const meta = await window.electronAPI.probeMedia(p);
        const keyframes = await window.electronAPI.getKeyframes(p).catch(() => []);
        
        // Optional thumbnail generation for timeline
        let thumbnails: { time: number; path: string }[] = [];
        try {
          thumbnails = await window.electronAPI.generateThumbnails({
            filePath: p,
            count: 12,
            duration: meta.duration
          });
        } catch (_) {}

        newFiles.push({
          ...meta,
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          keyframes,
          thumbnails
        });
      }

      setFiles((prev) => [...prev, ...newFiles]);
      if (!activeFileId && newFiles.length > 0) {
        setActiveFileId(newFiles[0].id);
      }
    } catch (err: any) {
      alert(`Error loading media file: ${err.message}`);
    }
  };

  // Re-order files in media bin
  const handleMoveFile = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= files.length) return;
    const copy = [...files];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setFiles(copy);
  };

  // Remove video file
  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (activeFileId === id) {
      const remaining = files.filter((f) => f.id !== id);
      setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Split Segment at Current Playhead
  const handleSplitSegment = useCallback(() => {
    if (!activeVideo || segments.length === 0) return;

    let targetTime = currentTime;
    if (snapToKeyframes && activeVideo.keyframes) {
      targetTime = findNearestKeyframe(activeVideo.keyframes, currentTime);
    }

    // Find the segment containing targetTime
    const targetIdx = segments.findIndex(
      (s) => targetTime > s.startTime + 0.1 && targetTime < s.endTime - 0.1
    );

    if (targetIdx === -1) return;

    const original = segments[targetIdx];
    const part1: TimelineSegment = {
      ...original,
      endTime: targetTime
    };

    const part2: TimelineSegment = {
      id: `seg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fileId: original.fileId,
      startTime: targetTime,
      endTime: original.endTime,
      color: getRandomColor(segments.length + 1),
      label: `Segment ${segments.length + 1}`
    };

    const updated = [...segments];
    updated.splice(targetIdx, 1, part1, part2);
    setSegments(updated);
    setActiveSegmentId(part2.id);
  }, [activeVideo, segments, currentTime, snapToKeyframes]);

  // Adjust Start (In Point) of active segment
  const handleSetInPoint = useCallback((time: number) => {
    if (!activeSegmentId) return;
    let target = time;
    if (snapToKeyframes && activeVideo?.keyframes) {
      target = findNearestKeyframe(activeVideo.keyframes, time);
    }
    setSegments((prev) =>
      prev.map((s) =>
        s.id === activeSegmentId ? { ...s, startTime: Math.min(target, s.endTime - 0.1) } : s
      )
    );
  }, [activeSegmentId, snapToKeyframes, activeVideo]);

  // Adjust End (Out Point) of active segment
  const handleSetOutPoint = useCallback((time: number) => {
    if (!activeSegmentId) return;
    let target = time;
    if (snapToKeyframes && activeVideo?.keyframes) {
      target = findNearestKeyframe(activeVideo.keyframes, time);
    }
    setSegments((prev) =>
      prev.map((s) =>
        s.id === activeSegmentId ? { ...s, endTime: Math.max(target, s.startTime + 0.1) } : s
      )
    );
  }, [activeSegmentId, snapToKeyframes, activeVideo]);

  // Add a new segment
  const handleAddSegment = () => {
    if (!activeVideo) return;
    const newSeg: TimelineSegment = {
      id: `seg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fileId: activeVideo.id,
      startTime: currentTime,
      endTime: Math.min(activeVideo.duration, currentTime + 5),
      color: getRandomColor(segments.length),
      label: `Segment ${segments.length + 1}`
    };
    setSegments((prev) => [...prev, newSeg]);
    setActiveSegmentId(newSeg.id);
  };

  const handleDeleteSegment = (id: string) => {
    if (segments.length <= 1) return;
    setSegments((prev) => prev.filter((s) => s.id !== id));
    if (activeSegmentId === id) {
      const remaining = segments.filter((s) => s.id !== id);
      setActiveSegmentId(remaining[0].id);
    }
  };

  // Start Export Process
  const handleStartExport = async (mode: ExportMode) => {
    if (!window.electronAPI) return;

    try {
      const savePath = await window.electronAPI.saveFileDialog({
        defaultPath: mode === 'merge_files' ? 'lossless_merged.mp4' : 'lossless_trimmed.mp4'
      });
      if (!savePath) return;

      setIsExporting(true);
      setExportProgress({ jobId: 'export_1', percent: 0 });
      setExportedPath(null);
      const jobId = `job_${Date.now()}`;
      setCurrentJobId(jobId);

      if (mode === 'merge_files') {
        // Concat all files in media bin
        const paths = files.map((f) => f.path);
        const result = await window.electronAPI.losslessMerge({
          inputPaths: paths,
          outputPath: savePath,
          jobId
        });
        setExportedPath(result.outputPath);
      } else if (mode === 'merge_segments' && activeVideo) {
        if (segments.length === 1) {
          // Direct single trim
          const seg = segments[0];
          const result = await window.electronAPI.losslessTrim({
            inputPath: activeVideo.path,
            outputPath: savePath,
            startTime: seg.startTime,
            endTime: seg.endTime,
            jobId
          });
          setExportedPath(result.outputPath);
        } else {
          // Trim all segments to temporary clips then concat
          const tempTrimmed: string[] = [];
          for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            const tempOut = savePath.replace(/\.[^/.]+$/, `_part_${i}.mp4`);
            await window.electronAPI.losslessTrim({
              inputPath: activeVideo.path,
              outputPath: tempOut,
              startTime: seg.startTime,
              endTime: seg.endTime,
              jobId: `${jobId}_p${i}`
            });
            tempTrimmed.push(tempOut);
          }
          const result = await window.electronAPI.losslessMerge({
            inputPaths: tempTrimmed,
            outputPath: savePath,
            jobId
          });
          setExportedPath(result.outputPath);
        }
      } else if (mode === 'all_segments_separate' && activeVideo) {
        // Export each segment to separate numbered file
        for (let i = 0; i < segments.length; i++) {
          const seg = segments[i];
          const outSegPath = savePath.replace(/\.[^/.]+$/, `_seg_${i + 1}.mp4`);
          await window.electronAPI.losslessTrim({
            inputPath: activeVideo.path,
            outputPath: outSegPath,
            startTime: seg.startTime,
            endTime: seg.endTime,
            jobId: `${jobId}_seg${i}`
          });
        }
        setExportedPath(savePath);
      }
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancelExport = async () => {
    if (currentJobId && window.electronAPI) {
      await window.electronAPI.cancelJob(currentJobId);
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input/select
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'KeyI' || e.key === '[') {
        e.preventDefault();
        handleSetInPoint(currentTime);
      } else if (e.code === 'KeyO' || e.key === ']') {
        e.preventDefault();
        handleSetOutPoint(currentTime);
      } else if (e.code === 'KeyS' || e.code === 'KeyC') {
        e.preventDefault();
        handleSplitSegment();
      } else if (e.code === 'KeyK') {
        e.preventDefault();
        if (activeVideo?.keyframes) {
          const nearest = findNearestKeyframe(activeVideo.keyframes, currentTime);
          setCurrentTime(nearest);
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 1 / (activeVideo?.fps || 30);
        setCurrentTime((t) => Math.max(0, t - step));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 1 / (activeVideo?.fps || 30);
        setCurrentTime((t) => Math.min(activeVideo?.duration || 100, t + step));
      } else if (e.ctrlKey && e.code === 'KeyO') {
        e.preventDefault();
        handleOpenFiles();
      } else if (e.ctrlKey && e.code === 'KeyE') {
        e.preventDefault();
        if (activeVideo) setIsExportModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, activeVideo, handleSetInPoint, handleSetOutPoint, handleSplitSegment]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0e14] text-gray-200 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        onOpenFiles={handleOpenFiles}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onSplitSegment={handleSplitSegment}
        hasActiveVideo={!!activeVideo}
        segmentCount={segments.length}
        isExporting={isExporting}
      />

      {/* Main Workspace (Media Bin + Video Player) */}
      <div className="flex-1 flex overflow-hidden">
        <MediaBin
          files={files}
          activeFileId={activeFileId}
          onSelectFile={(id) => setActiveFileId(id)}
          onRemoveFile={handleRemoveFile}
          onMoveFile={handleMoveFile}
          onAddFiles={handleOpenFiles}
        />

        <Player
          video={activeVideo}
          currentTime={currentTime}
          onTimeUpdate={(t) => setCurrentTime(t)}
          onSetInPoint={handleSetInPoint}
          onSetOutPoint={handleSetOutPoint}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          snapToKeyframes={snapToKeyframes}
          setSnapToKeyframes={setSnapToKeyframes}
        />
      </div>

      {/* Bottom Interactive Timeline */}
      <Timeline
        video={activeVideo}
        currentTime={currentTime}
        onSeek={(t) => setCurrentTime(t)}
        segments={segments}
        activeSegmentId={activeSegmentId}
        onSelectSegment={(id) => setActiveSegmentId(id)}
        onUpdateSegment={(id, updates) => {
          setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
        }}
        onDeleteSegment={handleDeleteSegment}
        onAddSegment={handleAddSegment}
        onSplitSegment={handleSplitSegment}
        snapToKeyframes={snapToKeyframes}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setExportedPath(null);
        }}
        activeVideo={activeVideo}
        allVideos={files}
        segments={segments}
        onStartExport={handleStartExport}
        onCancelExport={handleCancelExport}
        isExporting={isExporting}
        progress={exportProgress}
        exportedPath={exportedPath}
        onShowInFolder={(path) => window.electronAPI?.showItemInFolder(path)}
      />

      {/* Keyboard Shortcuts & Lossless Cut Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

export default App;
