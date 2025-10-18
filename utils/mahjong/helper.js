import { shantenNormal } from "./shantenCalculator.js";

export function sortHand(hand) {
    return [...hand].sort((a, b) => a - b);
}

export function countTiles(hand) {
    const counts = new Array(34).fill(0);
    for (const t of hand) counts[t]++;
    return counts;
}

function randomTile() {
    return Math.floor(Math.random() * 34);
}

export function randomHand() {
    const hand = [];
    while (hand.length < 14) {
        hand.push(randomTile());
    }
    return hand;
}

export function improvementCount(handAfterDiscard) {
    const base = shantenNormal(handAfterDiscard);
    const counts = countTiles(handAfterDiscard);
    const improvements = [];

    for (let t = 0; t < 34; t++) {
        if (counts[t] >= 4) continue;
        const newHand = handAfterDiscard.concat(t);
        const s = shantenNormal(newHand);
        if (s < base) {
            improvements.push(t);
        }
    }
    return improvements;
}

// Map index 0~33 to Unicode
export function tileToUnicode(id) {
    if (id < 0 || id > 33) throw new Error("tile id out of range (0–33)");

    const code = 0x1F000 + id;
    if (id === 4) return String.fromCodePoint(code) + "\uFE0E";

    return String.fromCodePoint(code);
}

export function handToUnicode(hand) {
    return hand.map(tileToUnicode).join("");;
}

export function mspzToTile(str) {
    const m = str.match(/^(\d)([mspz])$/);
    if (!m) return null;

    const num = parseInt(m[1]);
    const suit = m[2];

    if (suit === "z") {
      if (num < 1 || num > 7) return null;
      return num - 1; // 东→0, 白→6
    }
    if (suit === "m") {
      if (num < 1 || num > 9) return null;
      return 7 + (num - 1); // 万 1–9 → 7–15
    }
    if (suit === "s") {
      if (num < 1 || num > 9) return null;
      return 16 + (num - 1); // 索 1–9 → 16–24
    }
    if (suit === "p") {
      if (num < 1 || num > 9) return null;
      return 25 + (num - 1); // 饼 1–9 → 25–33
    }

    return null;
}

