import { shantenNormal } from "./shantenCalculator.js";

/**
 * Sorts a Mahjong hand numerically.
 * @param {number[]} hand - Array of tile IDs (0–33).
 * @returns {number[]} - New array with tiles sorted ascending.
 */
export function sortHand(hand) {
    return [...hand].sort((a, b) => a - b);
}

/**
 * Counts the occurrences of each tile in a hand.
 * @param {number[]} hand - Array of tile IDs (0–33).
 * @returns {number[]} - Array of length 34 where each index represents the count of that tile.
 */
export function countTiles(hand) {
    const counts = new Array(34).fill(0);
    for (const t of hand) counts[t]++;
    return counts;
}

/**
 * Generates a random single tile ID (0–33).
 * @returns {number} - Random tile ID.
 */
function randomTile() {
    return Math.floor(Math.random() * 34);
}

/**
 * Generates a random Mahjong hand of 14 tiles.
 * @returns {number[]} - Array of 14 tile IDs.
 */
export function randomHand() {
    const hand = [];
    while (hand.length < 14) {
        hand.push(randomTile());
    }
    return hand;
}

/**
 * Calculates which tiles would improve the hand if drawn.
 * @param {number[]} handAfterDiscard - Array of 13 tiles after a discard.
 * @returns {number[]} - Array of tile IDs that reduce shanten count when drawn.
 */
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

/**
 * Converts a tile ID (0–33) to its Unicode Mahjong character.
 * @param {number} id - Tile ID.
 * @returns {string} - Unicode character representing the tile.
 * @throws Will throw an error if the ID is out of range.
 */
export function tileToUnicode(id) {
    if (id < 0 || id > 33) throw new Error("tile id out of range (0–33)");

    const code = 0x1F000 + id;
    if (id === 4) return String.fromCodePoint(code) + "\uFE0E";

    return String.fromCodePoint(code);
}

/**
 * Converts a string in mspz notation to a tile ID.
 * @param {string} str - Tile in mspz notation (e.g., "1m", "5p", "3s", "7z").
 * @returns {number|null} - Tile ID (0–33) or null if invalid.
 *
 * Suit mapping:
 *  - z (honors): 1–7 → 0–6 (East→0, White→6)
 *  - m (man): 1–9 → 7–15
 *  - s (sou): 1–9 → 16–24
 *  - p (pin): 1–9 → 25–33
 */
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

