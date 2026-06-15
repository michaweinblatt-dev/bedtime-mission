export const STORAGE_KEY = 'bedtime_v30';
export const GAME_INDEX_KEY = 'bedtime_gameIndex';
export const APP_MODE_KEY = 'bedtime_appMode';
export const MORNING_GAME_INDEX_KEY = 'bedtime_morningGameIndex';

export const MAIN_SUBTITLES = [
  "Complete your missions to unlock tonight's parent challenge.",
  "Finish strong. Tonight's game is worth it.",
  "Your missions unlock something good tonight.",
];

export const MORNING_SUBTITLES = [
  "Complete your missions and earn today's car ride challenge!",
  "Finish strong. Today's reward is worth it.",
  "Your missions unlock something good this morning.",
];

export const MORNING_HANDOFF_LINES = [
  "Your turn, Mom & Dad. 🎯",
  "Kid-stronauts: mission complete. Parents: time to shine. ⭐",
  "Astronauts earned it. Parents: you're on. 🚀",
];

export const HANDOFF_LINES = [
  "Your turn, Mom & Dad. 🎯",
  "Kids: you crushed it. Parents: deliver. 🎯",
  "The kids held up their end. Parents: show them how it's done.",
  "Kid-stronauts: mission complete. Parents: time to shine. ⭐",
  "Astronauts earned it. Parents: you're on. 🚀",
];

export const SPACE_DJ_PLAYLIST = [
  { id: 0, name: 'Rocket Pajama Party', url: '/Rocket.mp3' },
  { id: 1, name: 'Moonboot Dance Party', url: '/moonbot.mp3' },
];

export function getDefaultMorningTasks() {
  return [
    { id: 'dressed',   title: 'Get Dressed',        icon: 'shirt',      color: 'from-yellow-400 to-orange-400',  done: false },
    { id: 'breakfast', title: 'Eat Breakfast',       icon: 'utensils',   color: 'from-green-400 to-emerald-500',  done: false },
    { id: 'cleanup',   title: 'Clean Up Breakfast',  icon: 'trash-2',    color: 'from-teal-400 to-cyan-500',      done: false },
    { id: 'backpack',  title: 'Pack Backpack',       icon: 'backpack',   color: 'from-blue-400 to-indigo-500',    done: false },
    { id: 'mbrush',    title: 'Brush Teeth',         icon: 'smile',      color: 'from-pink-400 to-rose-500',      done: false },
    { id: 'shoes',     title: 'Shoes On',            icon: 'footprints', color: 'from-purple-400 to-fuchsia-500', done: false },
  ];
}

export function getMorningRewards() {
  return [
    { id: 'm1', title: 'DJ for the Ride 🎵',   desc: "You pick every song on the drive today. No complaints from the grown-ups." },
    { id: 'm2', title: '20 Questions 🤔',       desc: "Think of something — anything. Parents have to guess in 20 questions or less." },
    { id: 'm3', title: 'Joke Master 😂',        desc: "Tell your best joke. Parents are not allowed to laugh. Good luck to them." },
    { id: 'm4', title: 'Podcast Pick 🎙️',      desc: "You choose what everyone listens to on the ride. Your call." },
    { id: 'm5', title: 'Silly Question 🤔',     desc: "Ask a parent anything you want. They have to answer honestly." },
    { id: 'm6', title: 'Story Time 📖',         desc: "Make up a story together on the ride. Kid starts, parents add to it." },
  ];
}

export function getDefaultTasks() {
  return [
    { id: 'plate',    title: 'Clear Your Plate', icon: 'utensils', color: 'from-orange-400 to-amber-500',  done: false },
    { id: 'upstairs', title: 'Head Upstairs',    icon: 'arrow-up', color: 'from-cyan-400 to-blue-500',     done: false },
    { id: 'pajamas',  title: 'Pajamas',          icon: 'shirt',    color: 'from-purple-400 to-fuchsia-500',done: false },
    { id: 'bathroom', title: 'Bathroom',         icon: 'droplet',  color: 'from-blue-400 to-indigo-500',   done: false },
    { id: 'brush',    title: 'Brush Teeth',      icon: 'smile',    color: 'from-pink-400 to-rose-500',     done: false },
    { id: 'fun',      title: 'Having Fun',       icon: 'gamepad-2',color: 'from-pink-400 to-rose-500',     done: false },
  ];
}

export function getRewards() {
  return [
    { id: 'r1',  title: 'Robot Mode \uD83E\uDD16',          desc: "Hop on for a piggyback ride! The Kid steers the 'Parent Robot' by tapping buttons on Parent shoulders: 'BEEP. BOOP. TURN LEFT.'" },
    { id: 'r2',  title: 'The Buttons Game \uD83D\uDD18',    desc: 'Parent lays on the floor, knees up. Kid sits on stomach and presses down on parent fingers to generate different silly actions (like a bumpy ride, a sudden drop, tickle, a flip..) all from the knees up position!' },
    { id: 'r3',  title: 'Impromptu DJ Dance Party \uD83D\uDD7A', desc: 'One minute of wild dancing! Kid chooses the track (Rocket Pajama or Moonboot Dance)!' },
    { id: 'r4',  title: 'The Floor is Lava \uD83C\uDF0B',  desc: "The floor is lava! Kid is the explorer who can't touch the ground. Parent is a 'Bridge' or 'Rescue Boat' to help them cross safely to the bedroom." },
    { id: 'r5',  title: 'The Magic Remote \uD83D\uDCFA',   desc: "Kid holds the remote. When they press 'Rewind,' 'Slow-Mo,' or 'Fast Forward,' the Parent acts out that exact movement while heading to bed." },
    { id: 'r6',  title: 'Freeze Un-Freeze \uD83E\uDDCA',   desc: 'Speaks for itself.' },
    { id: 'r7',  title: 'The Parent Puppet \uD83E\uDDF5',   desc: "Parent is a puppet on strings. Kid 'pulls' the invisible strings to guide the giant puppet's arms and legs all the way to the bedroom." },
    { id: 'r8',  title: 'Pillow Fight! \u2601\uFE0F',       desc: 'Grab your pillows! You know what to do!' },
    { id: 'r9',  title: 'Wrestlemania! \uD83E\uDD3C',       desc: 'Parent vs Kid face off in a wrestling match for the ages!' },
    { id: 'r10', title: "Kids' Choice! \uD83D\uDC51",       desc: 'The Kid-stronauts get to invent a brand new way for the Parents to be silly tonight!' },
  ];
}

export function getDefaultAppState() {
  return {
    gameMode: 'team',
    activeProfileId: 'shared',
    rewardDuration: 120,
    currentGameIndex: 0,
    unlockedGames: [],
    usageHistory: [],
    profiles: {
      shared: {
        name: 'The Crew',
        tasks: getDefaultTasks(),
        morningTasks: getDefaultMorningTasks(),
        bestTime: null,
        morningBestTime: null,
        missionStartTime: null,
        missionEndTime: null,
        avatar: null,
      },
    },
  };
}
