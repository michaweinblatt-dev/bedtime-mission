import { useCallback } from 'react';
import { pickCaptain } from '../utils/captainRotation';

function loadBagState(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { bag: [], lastCaptainId: null };
}

function saveBagState(storageKey, state) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

// Independent shuffle-bag per storageKey — bedtime/morning/car-ride each
// get their own rotation so picking a captain in one never affects another.
export function useCaptainBag(storageKey) {
  const spin = useCallback((eligibleIds) => {
    const { bag, lastCaptainId } = loadBagState(storageKey);
    const { captainId, nextBag } = pickCaptain(bag, lastCaptainId, eligibleIds);
    saveBagState(storageKey, { bag: nextBag, lastCaptainId: captainId });
    return captainId;
  }, [storageKey]);

  return { spin };
}
