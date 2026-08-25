export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Picks the next captain from a shuffle-bag: everyone in eligibleIds goes
// once before anyone repeats. Reshuffles when the bag runs out, avoiding an
// immediate repeat of lastCaptainId as the first pick of the new cycle.
export function pickCaptain(bag, lastCaptainId, eligibleIds) {
  let nextBag = (bag || []).filter(id => eligibleIds.includes(id));

  if (nextBag.length === 0) {
    nextBag = shuffle(eligibleIds);
    if (nextBag.length > 1 && nextBag[0] === lastCaptainId) {
      const swapIdx = 1 + Math.floor(Math.random() * (nextBag.length - 1));
      [nextBag[0], nextBag[swapIdx]] = [nextBag[swapIdx], nextBag[0]];
    }
  }

  const [captainId, ...rest] = nextBag;
  return { captainId, nextBag: rest };
}
