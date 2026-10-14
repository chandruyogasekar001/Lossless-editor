import React from 'react';
import { 
  FolderPlus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Film, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { VideoFile } from '../types';
import { formatTime, formatBytes } from '../utils/formatters';

interface MediaBinProps {
  files: VideoFile[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
  onMoveFile: (index: number, direction: 'up' | 'down') => void;
  onAddFiles: () => void;
}

export const MediaBin: React.FC<MediaBinProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onRemoveFile,
  onMoveFile,
  onAddFiles
}) => {
  return (
    <div className="w-80 bg-[#12161f] border-r border-[#212836] flex flex-col select-none">
      {/* Bin Header */}
      <div className="h-12 border-b border-[#212836] px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">Media Bin</h2>
          <span className="text-[11px] bg-[#1b2230] text-gray-400 px-1.5 py-0.5 rounded font-mono">
            {files.length}
          </span>
        </div>
        <button
          onClick={onAddFiles}
          className="p-1.5 hover:bg-[#1b2230] text-blue-400 hover:text-blue-300 rounded transition-colors"
          title="Import Video Files"
        >
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {files.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#242d3d] rounded-lg">
            <Film className="w-8 h-8 text-gray-600 mb-2" />
            <p className="text-xs text-gray-400 font-medium">No videos loaded</p>
            <p className="text-[11px] text-gray-600 mt-1">Import multiple files to merge losslessly or trim segments.</p>
            <button
              onClick={onAddFiles}
              className="mt-3 text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-3 py-1 rounded border border-blue-500/30 font-medium"
            >
              Add Video
            </button>
          </div>
        ) : (
          files.map((file, idx) => {
            const isActive = file.id === activeFileId;
            return (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#1a2333] border-blue-500/50 shadow-sm' 
                    : 'bg-[#151a24] border-[#212836] hover:border-[#2f3a4e]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isActive ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    ) : (
                      <span className="w-3.5 text-[11px] font-mono text-gray-500 text-center shrink-0">
                        {idx + 1}
                      </span>
                    )}
                    <span className="text-xs font-medium text-gray-200 truncate" title={file.fileName}>
                      {file.fileName}
                    </span>
                  </div>

                  {/* Actions: Re-order for merger & Delete */}
                  <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onMoveFile(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-20"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onMoveFile(idx, 'down')}
                      disabled={idx === files.length - 1}
                      className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-20"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onRemoveFile(file.id)}
                      className="p-1 text-gray-500 hover:text-red-400 ml-1"
                      title="Remove from project"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* File Technical Badges */}
                <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] font-mono text-gray-400 bg-[#0e1219] p-1.5 rounded">
                  <div>
                    <span className="text-gray-500">Res:</span> {file.width}x{file.height}
                  </div>
                  <div>
                    <span className="text-gray-500">FPS:</span> {file.fps}
                  </div>
                  <div>
                    <span className="text-gray-500">Video:</span> {file.videoCodec}
                  </div>
                  <div>
                    <span className="text-gray-500">Audio:</span> {file.audioCodec}
                  </div>
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400">
                  <span className="font-mono text-blue-400">{formatTime(file.duration)}</span>
                  <span>{formatBytes(file.size)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Merger Info Box */}
      {files.length > 1 && (
        <div className="p-3 bg-[#161d2a] border-t border-[#212836] text-[11px] text-gray-400">
          <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-1">
            <Info className="w-3.5 h-3.5" />
            <span>Lossless Merger Ready</span>
          </div>
          <p className="text-[10px] leading-relaxed">
            Order videos using arrows. Export will concatenate all {files.length} videos losslessly without re-encoding!
          </p>
        </div>
      )}
    </div>
  );
};
