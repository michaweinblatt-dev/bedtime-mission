export function formatTime(s) {
  if (s === null || s === undefined || isNaN(s)) return '00:00';
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (Math.floor(s) % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export function getElapsed(p) {
  if (!p || !p.missionStartTime) return 0;
  const end = p.missionEndTime || Date.now();
  return (end - p.missionStartTime) / 1000;
}
