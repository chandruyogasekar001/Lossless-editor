import React from 'react';
import { 
  FolderPlus, 
  Download, 
  HelpCircle, 
  Scissors, 
  Film,
  Zap
} from 'lucide-react';

interface HeaderProps {
  onOpenFiles: () => void;
  onOpenExport: () => void;
  onOpenShortcuts: () => void;
  onSplitSegment: () => void;
  hasActiveVideo: boolean;
  segmentCount: number;
  isExporting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenFiles,
  onOpenExport,
  onOpenShortcuts,
  onSplitSegment,
  hasActiveVideo,
  segmentCount,
  isExporting
}) => {
  return (
    <header className="h-14 bg-[#12161f] border-b border-[#212836] px-4 flex items-center justify-between select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-blue-400 font-bold tracking-wide text-lg">
          <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <Film className="w-5 h-5 text-blue-400" />
          </div>
          <span>Lossless<span className="text-white">Studio</span></span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
          <Zap className="w-3 h-3" /> 0% Quality Loss (Direct Stream Copy)
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenFiles}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1b2230] hover:bg-[#252f42] text-gray-200 text-xs font-medium rounded-md border border-[#2e394e] transition-colors"
          title="Import video files (Ctrl+O)"
        >
          <FolderPlus className="w-4 h-4 text-blue-400" />
          <span>Add Video</span>
        </button>

        {hasActiveVideo && (
          <button
            onClick={onSplitSegment}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1b2230] hover:bg-[#252f42] text-gray-200 text-xs font-medium rounded-md border border-[#2e394e] transition-colors"
            title="Split segment at playhead (S)"
          >
            <Scissors className="w-4 h-4 text-amber-400" />
            <span>Split (S)</span>
          </button>
        )}

        <button
          onClick={onOpenExport}
          disabled={!hasActiveVideo || isExporting}
          className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
          title="Export lossless cut/merge"
        >
          <Download className="w-4 h-4" />
          <span>Export Lossless ({segmentCount})</span>
        </button>

        <button
          onClick={onOpenShortcuts}
          className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#1b2230] rounded-md transition-colors"
          title="Keyboard shortcuts & Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
