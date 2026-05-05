const ONBOARDING_KEY = 'bedtime_onboarded';

const BULLETS = [
  'Complete your missions to unlock tonight\'s parent-led game',
  'Tap COMPETITION to race your siblings',
  'Parents — you have to actually do the game 😄',
];

export default function OnboardingOverlay({ onDismiss }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/95 p-6"
      onClick={onDismiss}
    >
      <div
        className="bg-white rounded-[40px] p-8 max-w-sm w-full text-center shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-6xl mb-4">🚀</div>

        <h2 className="text-2xl font-black text-slate-800 mb-1">
          Welcome to Bedtime Mission 🚀
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Built by a dad and his 8-year-old
        </p>

        <ul className="text-left space-y-3 mb-8">
          {BULLETS.map((text, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-emerald-500 font-black mt-0.5 shrink-0">✓</span>
              <span className="text-slate-700 text-sm leading-snug">{text}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onDismiss}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black py-4 rounded-2xl text-base transition-all shadow-lg"
        >
          Let's Go! 🚀
        </button>
      </div>
    </div>
  );
}

export { ONBOARDING_KEY };
