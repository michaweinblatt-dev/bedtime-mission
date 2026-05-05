import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Smile, Droplet, Shirt, BookOpen, Gamepad2, Star,
  CheckCircle, Trash2, GripVertical,
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const wrapperStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  const isDone = task.done;

  const cardClass = [
    'p-6 rounded-[32px] border-4 flex flex-col items-center justify-center gap-3 cursor-pointer shadow-xl transition-all relative',
    isDone
      ? 'bg-slate-800/80 border-emerald-500 opacity-80'
      : `bg-gradient-to-br ${task.color || 'from-cyan-400 to-blue-500'} border-white/20 hover:scale-105`,
    isEditMode ? 'shake-anim border-pink-400' : '',
    isDone ? 'task-done-anim' : '',
  ].filter(Boolean).join(' ');

  return (
    <div ref={setNodeRef} style={wrapperStyle} {...attributes}>
      <div className={cardClass} onClick={onAction}>
        {isEditMode && (
          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-white/50 hover:text-white/90 touch-none cursor-grab active:cursor-grabbing"
            {...listeners}
            onClick={e => e.stopPropagation()}
            tabIndex={-1}
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-5 h-5" />
          </button>
        )}
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
    </div>
  );
}
