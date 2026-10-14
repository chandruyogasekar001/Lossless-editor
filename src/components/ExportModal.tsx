import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FolderCheck, 
  FileVideo, 
  Layers, 
  AlertCircle, 
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { VideoFile, TimelineSegment, ExportMode, ExportProgress } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeVideo: VideoFile | null;
  allVideos: VideoFile[];
  segments: TimelineSegment[];
  onStartExport: (mode: ExportMode, customPath?: string) => void;
  onCancelExport: () => void;
  isExporting: boolean;
  progress: ExportProgress | null;
  exportedPath: string | null;
  onShowInFolder: (path: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  activeVideo,
  allVideos,
  segments,
  onStartExport,
  onCancelExport,
  isExporting,
  progress,
  exportedPath,
  onShowInFolder
}) => {
  const [selectedMode, setSelectedMode] = useState<ExportMode>('merge_segments');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#141923] border border-[#263042] rounded-xl shadow-2xl overflow-hidden select-none">
        {/* Modal Header */}
        <div className="h-14 border-b border-[#212836] px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-gray-100 text-sm">Export Lossless Video</h3>
          </div>
          {!isExporting && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#202838]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Progress / Success State */}
          {isExporting ? (
            <div className="space-y-4 py-4 text-center">
              <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mx-auto" />
              <div>
                <h4 className="text-sm font-semibold text-gray-200">
                  Processing Lossless Stream Copy...
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  Writing video data without re-encoding at maximum hardware speed.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-[#202838] h-2.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${progress?.percent || 0}%` }}
                    className="bg-blue-500 h-full transition-all duration-200"
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-gray-400">
                  <span>{progress?.percent || 0}% Complete</span>
                  {progress?.currentTime !== undefined && (
                    <span>{progress.currentTime.toFixed(1)}s processed</span>
                  )}
                </div>
              </div>

              <button
                onClick={onCancelExport}
                className="text-xs text-red-400 hover:text-red-300 font-medium pt-2"
              >
                Cancel Export
              </button>
            </div>
          ) : exportedPath ? (
            <div className="space-y-4 py-3 text-center">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-200">Export Complete!</h4>
                <p className="text-xs text-gray-400 mt-1 break-all px-4 font-mono">
                  {exportedPath}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => onShowInFolder(exportedPath)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Show in File Explorer</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[#202838] hover:bg-[#2b374d] text-gray-300 rounded-lg text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Export Mode Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Select Export Mode
                </label>

                {/* Option 1: Merge active trimmed segments */}
                <div
                  onClick={() => setSelectedMode('merge_segments')}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                    selectedMode === 'merge_segments'
                      ? 'bg-blue-500/10 border-blue-500 text-white'
                      : 'bg-[#1b2230] border-[#293447] text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <Layers className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold">
                      Combine Trimmed Segments into One Video
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      Extracts your {segments.length} segment(s) and joins them losslessly into a single clean video file.
                    </div>
                  </div>
                </div>

                {/* Option 2: Export each segment separately */}
                <div
                  onClick={() => setSelectedMode('all_segments_separate')}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                    selectedMode === 'all_segments_separate'
                      ? 'bg-blue-500/10 border-blue-500 text-white'
                      : 'bg-[#1b2230] border-[#293447] text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <FileVideo className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold">
                      Export Segments as Separate Files
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      Exports each timeline cut segment into its own distinct file.
                    </div>
                  </div>
                </div>

                {/* Option 3: Lossless Merger of all media bin files */}
                {allVideos.length > 1 && (
                  <div
                    onClick={() => setSelectedMode('merge_files')}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                      selectedMode === 'merge_files'
                        ? 'bg-blue-500/10 border-blue-500 text-white'
                        : 'bg-[#1b2230] border-[#293447] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <FolderCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold">
                        Merge All Files in Media Bin ({allVideos.length} Videos)
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Concatenates all imported video clips in current order with 0% re-encoding quality degradation.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Lossless Notice */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2.5 text-[11px] text-blue-300 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>FFmpeg Stream Copy:</strong> Video and audio streams are copied directly byte-for-byte. The process is instant and preserves the exact original video bitrate, colors, and audio tracks.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!isExporting && !exportedPath && (
          <div className="h-14 border-t border-[#212836] px-6 bg-[#10141d] flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#1b2230] hover:bg-[#252f42] text-gray-300 rounded-lg text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => onStartExport(selectedMode)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Start Export
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
