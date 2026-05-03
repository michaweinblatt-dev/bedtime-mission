import { XCircle, BarChart2 } from 'lucide-react';
import { formatTime } from '../utils/helpers';

export default function StatsModal({ usageHistory, onClose }) {
  const last = usageHistory[usageHistory.length - 1];
  const recent = usageHistory.slice().reverse().slice(0, 5);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/90 backdrop-blur-md text-slate-800">
      <div className="bg-white rounded-[40px] p-8 max-w-md w-full mx-4 shadow-2xl h-[80vh] overflow-y-auto relative text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-300 hover:text-slate-500"
        >
          <XCircle className="w-8 h-8 text-slate-800" />
        </button>

        <h3 className="text-2xl font-black text-indigo-900 mb-6 flex items-center gap-2 uppercase text-center">
          <BarChart2 /> Mission Log
        </h3>

        {/* Tonight's breakdown */}
        <div className="mb-8 text-center text-slate-800">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest border-b pb-1">
            Tonight&apos;s Speed Breakdown
          </p>
          <div className="space-y-2 text-slate-800">
            {last ? last.players.map((player, i) => (
              <div key={i} className="p-3 bg-indigo-50 rounded-xl mb-2 text-left">
                <p className="font-black text-indigo-900 text-xs mb-2 uppercase text-center">{player.name}&apos;s Breakdown</p>
                {(player.tasks || []).map((t, j) => (
                  <div key={j} className="flex justify-between text-[11px] text-indigo-600 font-bold">
                    <span>{t.title}</span>
                    <span>{Math.round(t.duration || 0)}s</span>
                  </div>
                ))}
              </div>
            )) : (
              <p className="text-slate-400 text-sm">No missions completed yet tonight.</p>
            )}
          </div>
        </div>

        {/* Historical records */}
        <div className="text-center text-slate-800">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest border-b pb-1">
            Historical Records
          </p>
          <div className="space-y-3 text-left">
            {recent.length === 0 ? (
              <p className="text-slate-400 text-sm text-center">No history yet.</p>
            ) : recent.map((s, i) => (
              <div key={i} className="flex justify-between border-b pb-2 items-center text-slate-600 font-black">
                <div className="text-[11px] font-bold text-slate-800">{s.date}</div>
                <div className="text-indigo-600 font-black text-xs uppercase">
                  {s.players.map(p => formatTime(p.time)).join(' / ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
