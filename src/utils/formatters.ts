export function formatTime(seconds: number, includeMs = true): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const hh = h.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  const mmm = ms.toString().padStart(3, '0');

  if (includeMs) {
    return h > 0 ? `${hh}:${mm}:${ss}.${mmm}` : `${mm}:${ss}.${mmm}`;
  }
  return h > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function findNearestKeyframe(keyframes: number[] | undefined, targetTime: number): number {
  if (!keyframes || keyframes.length === 0) return targetTime;
  let closest = keyframes[0];
  let minDiff = Math.abs(targetTime - closest);

  for (let i = 1; i < keyframes.length; i++) {
    const diff = Math.abs(targetTime - keyframes[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = keyframes[i];
    }
  }

  return closest;
}

export const SEGMENT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function getRandomColor(index = 0): string {
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
}
