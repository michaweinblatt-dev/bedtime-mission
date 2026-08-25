import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { CloudUpload, Palette, User, Plus, Check } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';

import { STORAGE_KEY, GAME_INDEX_KEY, APP_MODE_KEY, MORNING_GAME_INDEX_KEY, SPACE_DJ_PLAYLIST, getDefaultTasks, getDefaultMorningTasks, getRewards, getMorningRewards, buildRewardPool, getDefaultAppState, MAIN_SUBTITLES, MORNING_SUBTITLES } from './utils/constants';
import { formatTime, getElapsed } from './utils/helpers';
import { track } from './utils/analytics';
import { useAudio } from './hooks/useAudio';

import Header from './components/Header';
import ProgressBar from './components/ProgressBar';
import TaskCard from './components/TaskCard';
import SuccessModal from './components/SuccessModal';
import SleepMode from './components/SleepMode';
import StatsModal from './components/StatsModal';
import CustomModal from './components/CustomModal';
import InstallPrompt from './components/InstallPrompt';
import OnboardingOverlay, { ONBOARDING_KEY } from './components/OnboardingOverlay';
import CaptainWheelModal from './components/CaptainWheelModal';
import GameWheelModal from './components/GameWheelModal';

function getProfileTasks(profile, appMode) {
  return appMode === 'morning' ? (profile.morningTasks || getDefaultMorningTasks()) : profile.tasks;
}

function setProfileTasks(profile, appMode, tasks) {
  return appMode === 'morning'
    ? { ...profile, morningTasks: tasks }
    : { ...profile, tasks };
}

function loadPersistedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const s = JSON.parse(saved);
      if (!s.usageHistory) s.usageHistory = [];
      if (!s.unlockedGames) s.unlockedGames = [];
      if (s.currentGameIndex === undefined) s.currentGameIndex = 0;
      // Prefer the separate family-wide key (source of truth)
      const familyIdx = localStorage.getItem(GAME_INDEX_KEY);
      if (familyIdx !== null) s.currentGameIndex = parseInt(familyIdx, 10) || 0;
      // Backfill morningTasks / includeTonight for existing profiles
      Object.keys(s.profiles || {}).forEach(id => {
        if (!s.profiles[id].morningTasks) {
          s.profiles[id].morningTasks = getDefaultMorningTasks();
        }
        if (s.profiles[id].morningBestTime === undefined) {
          s.profiles[id].morningBestTime = null;
        }
        if (s.profiles[id].includeTonight === undefined) {
          s.profiles[id].includeTonight = true;
        }
      });
      if (s.bedtimeCaptainId === undefined) s.bedtimeCaptainId = null;
      if (s.morningCaptainId === undefined) s.morningCaptainId = null;
      return s;
    }
  } catch {}
  return getDefaultAppState();
}

export default function App() {
  const [appState, setAppState] = useState(loadPersistedState);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPlayingBeat, setIsPlayingBeat] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [rewardTimeLeft, setRewardTimeLeft] = useState(() => loadPersistedState().rewardDuration || 120);
  const [currentReward, setCurrentReward] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSleepMode, setShowSleepMode] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);
  const [finalTimes, setFinalTimes] = useState([]);
  const [waitingMessage, setWaitingMessage] = useState(null);
  const [tick, setTick] = useState(0); // increments every second to drive timer display
  const [appMode, setAppModeState] = useState(() => localStorage.getItem(APP_MODE_KEY) || 'bedtime');
  const [subtitle, setSubtitle] = useState(() => {
    const mode = localStorage.getItem(APP_MODE_KEY) || 'bedtime';
    const list = mode === 'morning' ? MORNING_SUBTITLES : MAIN_SUBTITLES;
    return list[Math.floor(Math.random() * list.length)];
  });
  const [compFinishModal, setCompFinishModal] = useState(null); // { name, time, waiting: [] }
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem(ONBOARDING_KEY));

  // ── Bedtime Captain ──────────────────────────────────────────────────────────
  const [activeCaptainWheel, setActiveCaptainWheel] = useState(null); // 'bedtime' | 'morning' | null
  const [pendingGameWheel, setPendingGameWheel] = useState(null); // { finalState, times, elapsedSeconds, captainType, pool }

  const rewardTimerRef = useRef(null);
  const currentAudioRef = useRef(null);
  const startSleepModeRef = useRef(null);
  const editBtnRef = useRef(null);
  const [pulseEditBtn, setPulseEditBtn] = useState(false);

  const { unlockAudio, playRocketSound, playSuccessSound, playLullaby, stopLullaby, playCameraSound } = useAudio();

  // Drive the per-second timer display
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const saveAppState = useCallback((next) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setAppState(next);
  }, []);

  const activeProfile = appState.profiles[appState.activeProfileId];

  // ── Captain eligibility — driven by Astronaut profiles (needs >= 2 marked
  // "in" tonight). No separate roster: Astronauts are the one kid list. ───────
  const sibs = Object.keys(appState.profiles).filter(id => id !== 'shared');
  const captainRoster = sibs.map(id => ({
    id,
    name: appState.profiles[id].name,
    includeTonight: appState.profiles[id].includeTonight !== false,
  }));
  const captainEligible = captainRoster.filter(k => k.includeTonight).length >= 2;
  const bedtimeCaptainName = appState.bedtimeCaptainId ? captainRoster.find(k => k.id === appState.bedtimeCaptainId)?.name : null;
  const morningCaptainName = appState.morningCaptainId ? captainRoster.find(k => k.id === appState.morningCaptainId)?.name : null;

  // ── App mode (Bedtime / Morning) ─────────────────────────────────────────────
  const switchAppMode = useCallback((mode) => {
    localStorage.setItem(APP_MODE_KEY, mode);
    setAppModeState(mode);
    const list = mode === 'morning' ? MORNING_SUBTITLES : MAIN_SUBTITLES;
    setSubtitle(list[Math.floor(Math.random() * list.length)]);
    track('app_mode_changed', { mode });
  }, []);

  // ── Sleep mode ──────────────────────────────────────────────────────────────
  const startSleepMode = useCallback((triggeredBy = 'button') => {
    if (rewardTimerRef.current) clearInterval(rewardTimerRef.current);
    setShowSuccess(false);
    setShowSleepMode(true);
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsPlayingBeat(false);
    }
    if (appMode !== 'morning') playLullaby();
    track('sleep_mode_triggered', { triggered_by: triggeredBy });
  }, [playLullaby, appMode]);

  // Keep a stable ref so the reward timer interval can call it
  useEffect(() => { startSleepModeRef.current = startSleepMode; }, [startSleepMode]);

  // ── Reward timer ─────────────────────────────────────────────────────────────
  const startRewardTimer = useCallback((duration) => {
    if (rewardTimerRef.current) clearInterval(rewardTimerRef.current);
    setRewardTimeLeft(duration);
    rewardTimerRef.current = setInterval(() => {
      setRewardTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(rewardTimerRef.current);
          setTimeout(() => startSleepModeRef.current?.('timer'), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const adjustRewardTimer = useCallback((delta) => {
    setRewardTimeLeft(prev => {
      const next = Math.max(30, prev + delta);
      setAppState(s => {
        const updated = { ...s, rewardDuration: next };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      return next;
    });
  }, []);

  // ── Confetti ─────────────────────────────────────────────────────────────────
  const fireBigConfetti = useCallback(() => {
    const end = Date.now() + 3000;
    (function frame() {
      confetti({ particleCount: 5, angle: 60,  spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  }, []);

  // ── Finish success (shared tail: after a reward is known, either picked
  // automatically or via the Captain's game wheel) ─────────────────────────────
  const finishSuccess = useCallback((finalState, reward, times, elapsedSeconds) => {
    track('mission_completed', {
      game_shown: reward.title,
      elapsed_seconds: Math.round(elapsedSeconds ?? 0),
      game_mode: finalState.gameMode,
    });
    saveAppState(finalState);
    setFinalTimes(times);
    setCurrentReward(reward);
    setShowSuccess(true);
    playSuccessSound();
    fireBigConfetti();
    startRewardTimer(finalState.rewardDuration || 120);
  }, [saveAppState, playSuccessSound, fireBigConfetti, startRewardTimer]);

  // ── Trigger success ───────────────────────────────────────────────────────────
  const triggerSuccess = useCallback((stateSnapshot, isJoint) => {
    const isMorning = appMode === 'morning';
    const times = [];
    const log = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: stateSnapshot.gameMode,
      players: [],
    };

    const updatedProfiles = { ...stateSnapshot.profiles };
    const bestTimeKey = isMorning ? 'morningBestTime' : 'bestTime';

    if (isJoint) {
      Object.keys(stateSnapshot.profiles)
        .filter(id => id !== 'shared')
        .forEach(id => {
          const p = { ...stateSnapshot.profiles[id] };
          const elapsed = getElapsed(p);
          const activeTasks = getProfileTasks(p, appMode);
          log.players.push({ name: p.name, time: elapsed, tasks: activeTasks.map(t => ({ title: t.title, duration: t.duration })) });
          let rec = '';
          if (p[bestTimeKey] === null || p[bestTimeKey] === undefined || elapsed < p[bestTimeKey]) { p[bestTimeKey] = elapsed; rec = '🌟 RECORD!'; }
          updatedProfiles[id] = p;
          times.push(`${p.name}: ${formatTime(elapsed)} ${rec}`);
        });
    } else {
      const p = { ...stateSnapshot.profiles[stateSnapshot.activeProfileId] };
      const elapsed = getElapsed(p);
      const activeTasks = getProfileTasks(p, appMode);
      log.players.push({ name: p.name, time: elapsed, tasks: activeTasks.map(t => ({ title: t.title, duration: t.duration })) });
      let rec = '';
      if (p[bestTimeKey] === null || p[bestTimeKey] === undefined || elapsed < p[bestTimeKey]) { p[bestTimeKey] = elapsed; rec = '🌟 RECORD!'; }
      updatedProfiles[stateSnapshot.activeProfileId] = p;
      times.push(`${formatTime(elapsed)} ${rec}`);
    }

    const finalState = {
      ...stateSnapshot,
      profiles: updatedProfiles,
      usageHistory: [...(stateSnapshot.usageHistory || []), log],
    };
    const elapsedSeconds = log.players[0]?.time ?? 0;

    // If a Captain was picked for tonight/today, the Captain spins the game
    // wheel instead of the reward being auto-assigned — see GameWheelModal.
    const captainId = isMorning ? stateSnapshot.morningCaptainId : stateSnapshot.bedtimeCaptainId;
    if (captainId) {
      const captainType = isMorning ? 'morning' : 'bedtime';
      setPendingGameWheel({ finalState, times, elapsedSeconds, captainType, pool: buildRewardPool(appMode) });
      return;
    }

    // No Captain tonight — exactly today's behavior, unchanged.
    const rewards = isMorning ? getMorningRewards() : getRewards();
    const morningIdx = parseInt(localStorage.getItem(MORNING_GAME_INDEX_KEY) || '0', 10) || 0;
    const currentIdx = isMorning
      ? morningIdx % rewards.length
      : (stateSnapshot.currentGameIndex ?? 0) % rewards.length;
    const reward = rewards[currentIdx];

    finishSuccess(finalState, reward, times, elapsedSeconds);
  }, [appMode, finishSuccess]);

  // ── Toggle task ───────────────────────────────────────────────────────────────
  const toggleTask = useCallback(async (taskId) => {
    await unlockAudio();

    const prevProfile = appState.profiles[appState.activeProfileId];
    const prevTasks = getProfileTasks(prevProfile, appMode);
    const prevDoneCount = prevTasks.filter(t => t.done).length;

    let missionStartTime = prevProfile.missionStartTime;
    let lastTaskAt = prevProfile.lastTaskAt;
    if (!missionStartTime) {
      missionStartTime = Date.now();
      lastTaskAt = missionStartTime;
      const captainIdForMode = appMode === 'morning' ? appState.morningCaptainId : appState.bedtimeCaptainId;
      if (captainEligible && !captainIdForMode) {
        track('captain_skipped', { captain_type: appMode });
      }
    }

    const tasks = prevTasks.map(t => {
      if (t.id !== taskId) return t;
      if (!t.done) {
        const now = Date.now();
        const duration = (now - (lastTaskAt || missionStartTime)) / 1000;
        lastTaskAt = now;
        return { ...t, done: true, duration };
      }
      return { ...t, done: false, duration: null };
    });

    const newDoneCount = tasks.filter(t => t.done).length;
    if (newDoneCount > prevDoneCount) {
      playRocketSound(newDoneCount, tasks.length);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
      const completedTask = tasks.find(t => t.id === taskId);
      track('task_completed', {
        task_id: taskId,
        task_title: completedTask?.title,
        tasks_done: newDoneCount,
        tasks_total: tasks.length,
      });
    }

    const updatedProfile = setProfileTasks(
      { ...prevProfile, missionStartTime, lastTaskAt },
      appMode,
      tasks,
    );

    const allDone = tasks.length > 0 && tasks.every(t => t.done);
    if (allDone) updatedProfile.missionEndTime = Date.now();

    const nextState = {
      ...appState,
      profiles: { ...appState.profiles, [appState.activeProfileId]: updatedProfile },
    };

    if (allDone) {
      const sibs = Object.keys(nextState.profiles).filter(id => id !== 'shared');
      if (nextState.gameMode === 'competition' && sibs.length > 1) {
        if (sibs.every(id => getProfileTasks(nextState.profiles[id], appMode).every(t => t.done))) {
          saveAppState(nextState);
          triggerSuccess(nextState, true);
        } else {
          const waiting = sibs
            .filter(id => !getProfileTasks(nextState.profiles[id], appMode).every(t => t.done))
            .map(id => nextState.profiles[id].name);
          setWaitingMessage(`Waiting for: ${waiting.join(', ')}`);
          const finishedProfile = nextState.profiles[appState.activeProfileId];
          setCompFinishModal({
            name: finishedProfile.name,
            time: formatTime(getElapsed(finishedProfile)),
            waiting,
          });
          saveAppState(nextState);
        }
      } else {
        saveAppState(nextState);
        triggerSuccess(nextState, false);
      }
    } else {
      setWaitingMessage(null);
      saveAppState(nextState);
    }
  }, [appState, saveAppState, unlockAudio, playRocketSound, triggerSuccess, appMode, captainEligible]);

  // ── Reset ─────────────────────────────────────────────────────────────────────
  const resetMissions = useCallback(() => {
    const profiles = {};
    Object.keys(appState.profiles).forEach(id => {
      const p = appState.profiles[id];
      const resetTasks = getProfileTasks(p, appMode).map(t => ({ ...t, done: false, duration: null }));
      profiles[id] = {
        ...setProfileTasks(p, appMode, resetTasks),
        missionStartTime: null,
        missionEndTime: null,
        lastTaskAt: null,
      };
    });
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsPlayingBeat(false);
    }
    if (rewardTimerRef.current) clearInterval(rewardTimerRef.current);
    stopLullaby();
    track('day_reset');
    let nextGameIndex;
    if (appMode === 'morning') {
      const morningIdx = parseInt(localStorage.getItem(MORNING_GAME_INDEX_KEY) || '0', 10) || 0;
      nextGameIndex = (morningIdx + 1) % 6;
      localStorage.setItem(MORNING_GAME_INDEX_KEY, String(nextGameIndex));
    } else {
      nextGameIndex = ((appState.currentGameIndex ?? 0) + 1) % 10;
      localStorage.setItem(GAME_INDEX_KEY, String(nextGameIndex));
    }
    const captainReset = appMode === 'morning'
      ? { morningCaptainId: null }
      : { bedtimeCaptainId: null };
    const next = {
      ...appState,
      profiles,
      currentGameIndex: appMode === 'morning' ? appState.currentGameIndex : nextGameIndex,
      ...captainReset,
    };
    saveAppState(next);
    setShowSleepMode(false);
    setShowSuccess(false);
    setWaitingMessage(null);
  }, [appState, saveAppState, stopLullaby, appMode]);

  // ── Mode / profile switching ─────────────────────────────────────────────────
  const setGameMode = useCallback((mode) => {
    const sibs = Object.keys(appState.profiles).filter(id => id !== 'shared');
    const newActiveId =
      mode === 'team'
        ? 'shared'
        : appState.activeProfileId === 'shared' && sibs.length > 0
        ? sibs[0]
        : appState.activeProfileId;
    saveAppState({ ...appState, gameMode: mode, activeProfileId: newActiveId });
    track('mode_changed', { mode });
  }, [appState, saveAppState]);

  const switchProfile = useCallback((id) => {
    saveAppState({ ...appState, activeProfileId: id });
  }, [appState, saveAppState]);

  const toggleIncludeTonight = useCallback((id) => {
    const p = appState.profiles[id];
    const included = p.includeTonight !== false;
    saveAppState({
      ...appState,
      profiles: { ...appState.profiles, [id]: { ...p, includeTonight: !included } },
    });
  }, [appState, saveAppState]);

  // ── Audio / DJ ───────────────────────────────────────────────────────────────
  const toggleBeat = useCallback(async () => {
    await unlockAudio();
    if (isPlayingBeat) {
      if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
      setIsPlayingBeat(false);
    } else {
      const audio = new Audio(SPACE_DJ_PLAYLIST[currentTrackIndex].url);
      audio.loop = true;
      currentAudioRef.current = audio;
      setIsPlayingBeat(true);
      try {
        await audio.play();
      } catch {
        setIsPlayingBeat(false);
        currentAudioRef.current = null;
      }
    }
  }, [isPlayingBeat, currentTrackIndex, unlockAudio]);

  const setTrack = useCallback((index) => {
    setCurrentTrackIndex(index);
    if (isPlayingBeat && currentAudioRef.current) {
      currentAudioRef.current.pause();
      const audio = new Audio(SPACE_DJ_PLAYLIST[index].url);
      audio.loop = true;
      currentAudioRef.current = audio;
      audio.play().catch(() => {});
    }
  }, [isPlayingBeat]);

  // ── Edit mode / tasks ─────────────────────────────────────────────────────────
  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => {
      if (prev) saveAppState(appState);
      return !prev;
    });
  }, [appState, saveAppState]);

  const removeTask = useCallback((taskId) => {
    const p = appState.profiles[appState.activeProfileId];
    const updated = setProfileTasks(p, appMode, getProfileTasks(p, appMode).filter(t => t.id !== taskId));
    saveAppState({ ...appState, profiles: { ...appState.profiles, [appState.activeProfileId]: updated } });
  }, [appState, saveAppState, appMode]);

  const addTask = useCallback((title) => {
    if (!title?.trim()) return;
    const p = appState.profiles[appState.activeProfileId];
    const newTasks = [...getProfileTasks(p, appMode), { id: 'task_' + Date.now(), title: title.trim(), icon: 'star', color: 'from-cyan-400 to-blue-500', done: false }];
    const updated = setProfileTasks(p, appMode, newTasks);
    saveAppState({ ...appState, profiles: { ...appState.profiles, [appState.activeProfileId]: updated } });
  }, [appState, saveAppState, appMode]);

  // ── Reward spinning ───────────────────────────────────────────────────────────
  const respinReward = useCallback(() => {
    const pool = buildRewardPool(appMode);
    const reward = pool[Math.floor(Math.random() * pool.length)];
    track('game_spun', { game_shown: reward.title });
    setCurrentReward(reward);
    startRewardTimer(appState.rewardDuration || 120);
  }, [appState.rewardDuration, startRewardTimer, appMode]);

  // ── Drag-to-reorder ───────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleDragEnd = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return;
    const profile = appState.profiles[appState.activeProfileId];
    const activeTasks = getProfileTasks(profile, appMode);
    const oldIdx = activeTasks.findIndex(t => t.id === active.id);
    const newIdx = activeTasks.findIndex(t => t.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const updatedProfile = setProfileTasks(profile, appMode, arrayMove(activeTasks, oldIdx, newIdx));
    saveAppState({ ...appState, profiles: { ...appState.profiles, [appState.activeProfileId]: updatedProfile } });
  }, [appState, saveAppState, appMode]);

  // ── Profile management ────────────────────────────────────────────────────────
  const addSibling = useCallback(() => {
    setModalConfig({
      type: 'prompt',
      title: 'New Astronaut',
      showImage: true,
      confirmText: 'Add',
      onConfirm: (name, image) => {
        if (!name?.trim()) return;
        const id = 'p_' + Date.now();
        const next = {
          ...appState,
          profiles: {
            ...appState.profiles,
            [id]: { name: name.trim(), tasks: getDefaultTasks(), morningTasks: getDefaultMorningTasks(), bestTime: null, morningBestTime: null, missionStartTime: null, missionEndTime: null, lastTaskAt: null, avatar: image || null, includeTonight: true },
          },
          // Together mode always runs the shared checklist — only switch the
          // active profile when adding from Competition mode.
          activeProfileId: appState.gameMode === 'team' ? appState.activeProfileId : id,
        };
        saveAppState(next);
        const totalProfiles = Object.keys(next.profiles).filter(k => k !== 'shared').length;
        track('astronaut_added', { total_profiles: totalProfiles });
        setModalConfig(null);
      },
      onCancel: () => setModalConfig(null),
    });
  }, [appState, saveAppState]);

  const editAstronaut = useCallback((id) => {
    const p = appState.profiles[id];
    setModalConfig({
      type: 'prompt',
      title: 'Edit Astronaut',
      showImage: true,
      currentImage: p.avatar,
      defaultValue: p.name,
      showDelete: true,
      confirmText: 'Save',
      onDelete: () => {
        const profiles = { ...appState.profiles };
        delete profiles[id];
        saveAppState({ ...appState, profiles, activeProfileId: 'shared' });
        setModalConfig(null);
      },
      onConfirm: (newName, image) => {
        if (!newName?.trim()) return;
        saveAppState({
          ...appState,
          profiles: {
            ...appState.profiles,
            [id]: { ...appState.profiles[id], name: newName.trim(), avatar: image !== undefined ? image : appState.profiles[id].avatar },
          },
        });
        setModalConfig(null);
      },
      onCancel: () => setModalConfig(null),
    });
  }, [appState, saveAppState]);

  const promptNewTask = useCallback(() => {
    setModalConfig({
      type: 'prompt',
      title: 'Add Mission',
      confirmText: 'Add',
      onConfirm: (title) => {
        addTask(title);
        setModalConfig(null);
        // Give React one tick to render the new task, then scroll to the Done button and pulse it
        setTimeout(() => {
          editBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setPulseEditBtn(true);
          setTimeout(() => setPulseEditBtn(false), 2000);
        }, 150);
      },
      onCancel: () => setModalConfig(null),
    });
  }, [addTask]);

  const resetToDefaults = useCallback(() => {
    setModalConfig({
      type: 'confirm',
      title: 'Reset to defaults?',
      message: 'This will replace your current tasks with the default 6. Are you sure?',
      confirmText: 'Reset',
      onConfirm: () => {
        const defaultTasks = appMode === 'morning' ? getDefaultMorningTasks() : getDefaultTasks();
        const p = setProfileTasks(appState.profiles[appState.activeProfileId], appMode, defaultTasks);
        saveAppState({ ...appState, profiles: { ...appState.profiles, [appState.activeProfileId]: p } });
        setModalConfig(null);
      },
      onCancel: () => setModalConfig(null),
    });
  }, [appState, saveAppState, appMode]);

  const showCloudBackup = useCallback(() => {
    setModalConfig({
      type: 'message',
      title: 'Cloud Backup',
      message: 'Coming soon! Sync across all devices.',
      onConfirm: () => setModalConfig(null),
      onCancel: () => setModalConfig(null),
    });
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────────
  const isTeam = appState.gameMode === 'team';

  return (
    <div
      className="bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 min-h-screen text-white font-sans antialiased overflow-x-hidden flex flex-col selection:bg-pink-500 selection:text-white"
      onClick={unlockAudio}
    >
      {/* Top bar: App Mode toggle + Cloud Backup */}
      <div className="w-full flex items-center justify-between px-4 pt-4 pb-2 z-20 relative">
        <div className="flex bg-slate-800/80 p-1 rounded-full border border-indigo-500/20 shadow-lg">
          <button
            onClick={() => switchAppMode('bedtime')}
            className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wide transition-all ${appMode === 'bedtime' ? 'bg-indigo-500 text-white shadow-lg' : 'text-indigo-300'}`}
          >🌙 Bedtime</button>
          <button
            onClick={() => switchAppMode('morning')}
            className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wide transition-all ${appMode === 'morning' ? 'bg-amber-500 text-white shadow-lg' : 'text-indigo-300'}`}
          >☀️ Morning</button>
        </div>
        <button
          onClick={showCloudBackup}
          className="flex items-center gap-2 bg-slate-800/40 hover:bg-indigo-500/30 px-4 py-2 rounded-full border border-indigo-500/20 transition-all text-xs font-bold text-indigo-300"
        >
          <CloudUpload className="w-4 h-4 text-white" />
          <span className="text-white uppercase tracking-widest">Cloud Backup</span>
        </button>
      </div>

      {/* Header */}
      <Header appState={appState} appMode={appMode} tick={tick} subtitle={subtitle} />

      {/* Mode toggle + Profile selector */}
      <div className="max-w-4xl mx-auto w-full px-4 mb-4 z-10 relative text-slate-800">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <div className="flex bg-slate-800/80 p-1 rounded-full border border-indigo-500/20 shrink-0 shadow-lg">
            <button
              onClick={() => setGameMode('team')}
              className={`px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${isTeam ? 'bg-indigo-500 text-white shadow-lg' : 'text-indigo-300'}`}
            >Together</button>
            <button
              onClick={() => setGameMode('competition')}
              className={`px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${!isTeam ? 'bg-indigo-500 text-white shadow-lg' : 'text-indigo-300'}`}
            >Competition</button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-3 custom-scrollbar px-2 w-full text-white font-black">
            {sibs.map(id => {
              const p = appState.profiles[id];
              const isActive = !isTeam && id === appState.activeProfileId;
              const isRunning = !isTeam && p.missionStartTime && !p.missionEndTime;
              const isDone = !isTeam && !!p.missionEndTime;
              const included = p.includeTonight !== false;
              return (
                <button
                  key={id}
                  onClick={() => (isTeam || isActive) ? editAstronaut(id) : switchProfile(id)}
                  className={`relative px-4 py-2 rounded-[20px] font-extrabold text-sm transition-all border-2 flex-shrink-0 flex flex-col items-center gap-1 ${isActive ? 'bg-indigo-500 text-white border-indigo-400 scale-105 shadow-md' : 'bg-slate-800 text-indigo-300 border-indigo-500/20'}`}
                >
                  {sibs.length >= 2 && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); toggleIncludeTonight(id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleIncludeTonight(id); } }}
                      aria-label={included ? `Exclude ${p.name} tonight` : `Include ${p.name} tonight`}
                      title={included ? 'In for tonight — tap to skip' : "Skipping tonight — tap to include"}
                      className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${included ? 'bg-emerald-500 border-emerald-300' : 'bg-slate-700 border-slate-500'}`}
                    >
                      {included && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </span>
                  )}
                  <div className="flex items-center gap-2 text-slate-100 font-black text-white">
                    {p.avatar
                      ? <div className="astronaut-visor w-6 h-6 border border-white/30"><img src={p.avatar} className="w-full h-full object-cover" /></div>
                      : <User className="w-4 h-4 text-white" />
                    }
                    <span>{p.name}</span>
                  </div>
                  {isRunning && (
                    <span className="text-[10px] font-mono text-pink-400">
                      {formatTime(getElapsed(p))}
                    </span>
                  )}
                  {isDone && <span className="text-[10px] text-emerald-400 uppercase font-bold">Done</span>}
                </button>
              );
            })}
            <button
              onClick={addSibling}
              className="px-4 py-3 rounded-[20px] font-bold text-xs bg-pink-500/10 text-pink-400 border-2 border-pink-500/30 flex-shrink-0 border-dashed hover:bg-pink-500/20 transition-all"
            >
              + Add Astronaut
            </button>
          </div>
        </div>

        {waitingMessage && (
          <p className="text-center text-pink-400 font-bold text-sm mb-2">{waitingMessage}</p>
        )}

        {/* Bedtime / Morning Captain — optional, hidden unless >= 2 kids are in tonight */}
        {captainEligible && (
          <div className="flex flex-col items-center gap-2 mb-4">
            {appMode === 'morning' ? (
              morningCaptainName ? (
                <p className="text-amber-300 font-black text-sm uppercase tracking-wide">👑 Captain: {morningCaptainName}</p>
              ) : (
                <button
                  onClick={() => setActiveCaptainWheel('morning')}
                  className="text-xs font-bold text-amber-300 bg-slate-800/50 hover:bg-slate-800/80 px-4 py-2 rounded-full border border-amber-400/30 transition-all"
                >
                  🎡 Spin the wheel for today's Morning Captain
                </button>
              )
            ) : (
              bedtimeCaptainName ? (
                <p className="text-indigo-300 font-black text-sm uppercase tracking-wide">👑 Captain: {bedtimeCaptainName}</p>
              ) : (
                <button
                  onClick={() => setActiveCaptainWheel('bedtime')}
                  className="text-xs font-bold text-indigo-300 bg-slate-800/50 hover:bg-slate-800/80 px-4 py-2 rounded-full border border-indigo-400/30 transition-all"
                >
                  🎡 Spin the wheel for tonight's Bedtime Captain
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <ProgressBar tasks={activeProfile ? getProfileTasks(activeProfile, appMode) : []} />

      {/* Task grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <main className="max-w-4xl mx-auto w-full px-4 pb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow z-10 relative">
        <SortableContext items={(activeProfile ? getProfileTasks(activeProfile, appMode) : []).map(t => t.id)} strategy={rectSortingStrategy}>
          {(activeProfile ? getProfileTasks(activeProfile, appMode) : []).map(task => (
            <TaskCard
              key={task.id}
              task={task}
              isEditMode={isEditMode}
              onAction={() => isEditMode ? removeTask(task.id) : toggleTask(task.id)}
            />
          ))}
        </SortableContext>
        {isEditMode && (
          <div
            onClick={promptNewTask}
            className="p-6 rounded-[32px] border-4 border-dashed border-indigo-400/50 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-800/50 transition-all text-center"
          >
            <div className="p-4 rounded-[20px] bg-indigo-500/20 mx-auto text-center flex items-center justify-center">
              <Plus className="w-10 h-10 text-indigo-300" />
            </div>
            <span className="font-black text-lg text-indigo-300 uppercase tracking-tighter block mt-2 text-center text-white">
              Add Mission
            </span>
          </div>
        )}
      </main>
      </DndContext>

      {/* Footer */}
      <div className="mt-auto py-8 flex flex-col items-center gap-4 z-10 relative">
        {isEditMode && (
          <button
            onClick={resetToDefaults}
            className="text-indigo-500 hover:text-indigo-300 text-xs underline underline-offset-2 transition-colors"
          >
            Reset to default tasks
          </button>
        )}
        <button
          ref={editBtnRef}
          onClick={toggleEditMode}
          className={`text-indigo-400 hover:text-white text-sm flex items-center gap-2 transition-colors bg-slate-800/50 px-6 py-3 rounded-full border border-indigo-500/20 shadow-lg ${pulseEditBtn ? 'animate-pulse' : ''}`}
        >
          <Palette className={`w-4 h-4 ${isEditMode ? 'text-pink-400' : 'text-indigo-400'}`} />
          <span className={`font-black ${isEditMode ? 'text-pink-400' : 'text-indigo-400'}`}>
            {isEditMode ? 'Done Editing' : 'Make it your own'}
          </span>
        </button>
      </div>

      {/* Floating Done button — always visible at bottom of screen in edit mode */}
      {isEditMode && (
        <button
          onClick={toggleEditMode}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-black px-8 py-3 rounded-full shadow-xl transition-all"
        >
          Done ✓
        </button>
      )}

      {/* Competition individual finish modal */}
      {compFinishModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/60">
          <div className="bg-indigo-950 border border-indigo-500/40 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">
              {compFinishModal.name} finished!
            </h2>
            <p className="text-indigo-300 text-lg font-bold mb-6">
              {compFinishModal.time}
            </p>
            <p className="text-pink-400 font-black text-sm uppercase tracking-widest mb-8">
              Now cheer on {compFinishModal.waiting.join(' & ')}! 🎉
            </p>
            <button
              onClick={() => setCompFinishModal(null)}
              className="bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-white font-black px-8 py-3 rounded-full transition-all w-full"
            >
              Let's go!
            </button>
          </div>
        </div>
      )}

      {/* Overlays / Modals */}
      {showSuccess && currentReward && (
        <SuccessModal
          reward={currentReward}
          rewardTimeLeft={rewardTimeLeft}
          appMode={appMode}
          nightNumber={appMode === 'morning'
            ? (parseInt(localStorage.getItem(MORNING_GAME_INDEX_KEY) || '0', 10) || 0) + 1
            : (appState.currentGameIndex ?? 0) + 1}
          isPlayingBeat={isPlayingBeat}
          currentTrackIndex={currentTrackIndex}
          finalTimes={finalTimes}
          onAdjustTimer={adjustRewardTimer}
          onSpin={respinReward}
          onToggleBeat={toggleBeat}
          onSetTrack={setTrack}
          onShowStats={() => setShowStats(true)}
          onSleepMode={startSleepMode}
        />
      )}

      {showSleepMode && <SleepMode appMode={appMode} onReset={resetMissions} />}

      {showStats && (
        <StatsModal usageHistory={appState.usageHistory} onClose={() => setShowStats(false)} />
      )}

      {modalConfig && (
        <CustomModal
          config={modalConfig}
          unlockAudio={unlockAudio}
          playCameraSound={playCameraSound}
        />
      )}

      <InstallPrompt />

      {activeCaptainWheel && (
        <CaptainWheelModal
          captainType={activeCaptainWheel}
          roster={captainRoster}
          onClose={() => setActiveCaptainWheel(null)}
          onDone={(captainId) => {
            const field = activeCaptainWheel === 'bedtime' ? 'bedtimeCaptainId' : 'morningCaptainId';
            saveAppState({ ...appState, [field]: captainId });
            setActiveCaptainWheel(null);
          }}
        />
      )}

      {pendingGameWheel && (
        <GameWheelModal
          captainType={pendingGameWheel.captainType}
          pool={pendingGameWheel.pool}
          onDone={(reward) => {
            finishSuccess(pendingGameWheel.finalState, reward, pendingGameWheel.times, pendingGameWheel.elapsedSeconds);
            setPendingGameWheel(null);
          }}
        />
      )}

      {showOnboarding && (
        <OnboardingOverlay onDismiss={() => {
          localStorage.setItem(ONBOARDING_KEY, 'true');
          setShowOnboarding(false);
        }} />
      )}
    </div>
  );
}
