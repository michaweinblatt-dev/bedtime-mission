import { useState } from 'react';
import { X, Plus, Trash2, Users } from 'lucide-react';

export default function CrewSheet({ roster, astronautNames, onSave, onClose }) {
  const [items, setItems] = useState(() => {
    if (roster.length > 0) return roster;
    if (astronautNames.length > 0) {
      return astronautNames.map(name => ({
        id: 'kid_' + Date.now() + Math.random().toString(36).slice(2, 6),
        name,
        includeTonight: true,
      }));
    }
    return [];
  });
  const [newName, setNewName] = useState('');

  const addKid = () => {
    const name = newName.trim();
    if (!name) return;
    setItems(prev => [...prev, { id: 'kid_' + Date.now(), name, includeTonight: true }]);
    setNewName('');
  };

  const removeKid = (id) => setItems(prev => prev.filter(k => k.id !== id));
  const toggleInclude = (id) => setItems(prev => prev.map(k => k.id === id ? { ...k, includeTonight: !k.includeTonight } : k));
  const renameKid = (id, name) => setItems(prev => prev.map(k => k.id === id ? { ...k, name } : k));

  const handleSave = () => {
    onSave(items.filter(k => k.name.trim()));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-6">
      <div className="bg-white rounded-[40px] p-6 sm:p-8 max-w-sm w-full shadow-2xl relative max-h-[85vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-slate-500" aria-label="Close">
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2 justify-center mb-1 text-indigo-500">
          <Users className="w-5 h-5" />
          <h2 className="text-xl font-black text-indigo-900 uppercase tracking-tight text-center">Manage Crew</h2>
        </div>
        <p className="text-xs text-slate-400 text-center mb-6">
          Add your kid-stronauts. Uncheck anyone skipping tonight.
        </p>

        <div className="space-y-2 mb-4">
          {items.map(k => (
            <div key={k.id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
              <input
                type="checkbox"
                checked={k.includeTonight}
                onChange={() => toggleInclude(k.id)}
                className="w-5 h-5 accent-indigo-600 shrink-0"
                aria-label={`Include ${k.name} tonight`}
              />
              <input
                type="text"
                value={k.name}
                onChange={e => renameKid(k.id, e.target.value)}
                className="flex-1 bg-transparent font-bold text-slate-700 outline-none min-w-0"
              />
              <button onClick={() => removeKid(k.id)} className="text-slate-300 hover:text-red-400 shrink-0" aria-label={`Remove ${k.name}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">No kids added yet.</p>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addKid()}
            placeholder="Add a kid's name..."
            className="flex-1 px-4 py-2.5 border-2 border-indigo-100 rounded-xl text-slate-800 font-bold focus:border-indigo-500 outline-none min-w-0"
          />
          <button onClick={addKid} className="bg-indigo-100 text-indigo-600 p-2.5 rounded-xl hover:bg-indigo-200 transition-colors shrink-0" aria-label="Add kid">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black py-3.5 rounded-2xl transition-all shadow-lg"
        >
          Done
        </button>
      </div>
    </div>
  );
}
