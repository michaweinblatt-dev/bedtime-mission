import {
  Smile, Droplet, Shirt, BookOpen, Gamepad2, Star,
  CheckCircle, Trash2,
  Moon, Sun, Heart, Zap, Music, Coffee, Apple, Cloud,
  Utensils, ArrowUp,
} from 'lucide-react';

const ICON_MAP = {
  'smile':      Smile,
  'droplet':    Droplet,
  'shirt':      Shirt,
  'book-open':  BookOpen,
  'gamepad-2':  Gamepad2,
  'star':       Star,
  'moon':       Moon,
  'sun':        Sun,
  'heart':      Heart,
  'zap':        Zap,
  'music':      Music,
  'coffee':     Coffee,
  'apple':      Apple,
  'utensils':   Utensils,
  'arrow-up':   ArrowUp,
  'cloud':      Cloud,
};

function TaskIcon({ name, className }) {
  const Icon = ICON_MAP[name] || Star;
  return <Icon className={className} />;
}

export default function TaskCard({ task, isEditMode, onAction }) {
  const isDone = task.done;

  const cardClass = [
    'p-6 rounded-[32px] border-4 flex flex-col items-center justify-center gap-3 cursor-pointer shadow-xl transition-all',
    isDone
      ? 'bg-slate-800/80 border-emerald-500 opacity-80'
      : `bg-gradient-to-br ${task.color || 'from-cyan-400 to-blue-500'} border-white/20 hover:scale-105`,
    isEditMode ? 'shake-anim border-pink-400' : '',
    isDone ? 'task-done-anim' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClass} onClick={onAction}>
      <div className="p-4 rounded-[20px] bg-white/10">
        {isEditMode
          ? <Trash2 className="w-10 h-10 text-white" />
          : isDone
            ? <CheckCircle className="w-10 h-10 text-white" />
            : <TaskIcon name={task.icon} className="w-10 h-10 text-white" />
        }
      </div>
      <span className={`font-black text-lg text-center ${isDone ? 'line-through text-emerald-400' : ''}`}>
        {task.title}
      </span>
    </div>
  );
}
