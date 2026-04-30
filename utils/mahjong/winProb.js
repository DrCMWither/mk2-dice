import { shantenNormal } from "./shantenCalculator.js";
import { countTiles } from "./helper.js";

function keyOf(counts, drawsLeft) {
    return `${drawsLeft}|${counts.join("")}`;
}

export function remainingCountsFromVisible(hand, visible = []) {
    const counts = new Array(34).fill(4);

    for (const t of hand) counts[t]--;
    for (const t of visible) counts[t]--;

    return counts.map(x => Math.max(0, x));
}

export function getImprovingTiles13(hand13, remainingCounts) {
    const base = shantenNormal(hand13);
    const waits = [];

    for (let t = 0; t < 34; t++) {
        if (remainingCounts[t] <= 0) continue;

        const nextHand = hand13.concat(t);
        const s = shantenNormal(nextHand);

        if (s < base || s === -1) {
            waits.push(t);
        }
    }

    return waits;
}

function maxAfterDiscard14(hand14, remainingCounts, drawsLeft, memo) {
    let best = 0;

    const seen = new Set();

    for (let i = 0; i < hand14.length; i++) {
        const discard = hand14[i];
        if (seen.has(discard)) continue;
        seen.add(discard);

        const hand13 = hand14.slice(0, i).concat(hand14.slice(i + 1));
        const p = winProb13(hand13, remainingCounts, drawsLeft, memo);

        if (p > best) best = p;
    }

    return best;
}

export function winProb13(hand13, remainingCounts, drawsLeft, memo = new Map()) {
    if (drawsLeft <= 0) return 0;

    const shanten = shantenNormal(hand13);

    if (shanten < 0) return 1;

    const key = keyOf(countTiles(hand13), drawsLeft);
    if (memo.has(key)) return memo.get(key);

    const wall = remainingCounts.reduce((a, b) => a + b, 0);
    if (wall <= 0) return 0;

    const waits = getImprovingTiles13(hand13, remainingCounts);

    let p = 0;

    for (const t of waits) {
        const n = remainingCounts[t];
        if (n <= 0) continue;

        remainingCounts[t]--;

        const hand14 = hand13.concat(t);
        const afterDraw =
            shantenNormal(hand14) === -1
                ? 1
                : maxAfterDiscard14(hand14, remainingCounts, drawsLeft - 1, memo);

        remainingCounts[t]++;

        p += (n / wall) * afterDraw;
    }

    const missCount = wall - waits.reduce((sum, t) => sum + remainingCounts[t], 0);
    if (missCount > 0) {
        p += (missCount / wall) * winProb13(hand13, remainingCounts, drawsLeft - 1, memo);
    }

    memo.set(key, p);
    return p;
}