import React from 'react';
import { X, Keyboard, HelpCircle } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause Video' },
    { key: 'I / [', desc: 'Set Cut In Point (Start of Segment)' },
    { key: 'O / ]', desc: 'Set Cut Out Point (End of Segment)' },
    { key: 'S / C', desc: 'Split segment at playhead' },
    { key: 'Left / Right', desc: 'Step backward / forward by 1 frame' },
    { key: 'Shift + Left / Right', desc: 'Step backward / forward by 1 second' },
    { key: 'K', desc: 'Snap playhead to closest Keyframe (I-Frame)' },
    { key: 'Delete / Backspace', desc: 'Delete active segment' },
    { key: 'Ctrl + O', desc: 'Add / Open video files' },
    { key: 'Ctrl + E', desc: 'Open Export dialog' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#141923] border border-[#263042] rounded-xl shadow-2xl overflow-hidden select-none">
        <div className="h-14 border-b border-[#212836] px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-gray-100 text-sm">Keyboard Shortcuts & Editing Guide</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#202838]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Lossless Cut Explanation */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2.5 text-xs text-amber-300 leading-relaxed">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">How Lossless Cutting Works:</span>
              <p className="mt-1 text-gray-300">
                Lossless editing copies video packets directly without re-encoding. Video streams are structured into <strong>Keyframes (I-Frames)</strong> every few seconds. Cutting exactly on keyframes guarantees zero glitching at the start of cuts. Use the <em>"Keyframe Snap"</em> button or press <kbd className="bg-black/50 px-1 py-0.5 rounded text-amber-300 font-mono">K</kbd> to align cuts with keyframes!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-2">
            {shortcuts.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-[#171d29] border border-[#232c3d] rounded-lg text-xs"
              >
                <span className="text-gray-300">{s.desc}</span>
                <kbd className="px-2 py-1 bg-[#0b0e14] border border-[#2b3547] text-blue-400 rounded font-mono text-[11px] font-semibold">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="h-12 border-t border-[#212836] px-6 bg-[#10141d] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1b2230] hover:bg-[#252f42] text-gray-300 rounded-md text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
