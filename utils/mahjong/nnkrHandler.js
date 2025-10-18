import { shantenNormal } from "./shantenCalculator.js";
import { improvementCount } from "./helper.js";
import { shuffle } from "../utils.js";

/**
 * Determines the best discard(s) for a hand based on shanten and improvement count.
 * @param {number[]} hand - Array of 14 tile IDs representing a Mahjong hand.
 * @returns {{ bestShanten: number, candidates: Array<{discard: number, shanten: number, improvements: number[]}> }}
 *  - bestShanten: minimal shanten value after discard
 *  - candidates: list of candidate discards achieving bestShanten, each with improvements
 */
export function bestDiscard(hand) {
    let bestShanten = Infinity;
    let candidates = [];

    for (let i = 0; i < hand.length; i++) {
        const newHand = hand.slice(0, i).concat(hand.slice(i + 1));
        const s = shantenNormal(newHand);
        const imps = improvementCount(newHand);

        if (s < bestShanten) {
            bestShanten = s;
            candidates = [{ discard: hand[i], shanten: s, improvements: imps }];
        } else if (s === bestShanten) {
            candidates.push({ discard: hand[i], shanten: s, improvements: imps });
        }
    }
    return { bestShanten, candidates };
}

const HONOR_TILES = [0, 1, 2, 3, 4, 5, 6];
const SUIT_TILES = {
    man: Array.from({ length: 9 }, (_, i) => 7 + i),
    pin: Array.from({ length: 9 }, (_, i) => 16 + i),
    sou: Array.from({ length: 9 }, (_, i) => 25 + i),
};

/**
 * Counts the number of complete melds (mentsu) in a tile count array.
 * @param {number[]} counts - Array of 34 tile counts.
 * @returns {number} - Number of melds.
 */
function countMentsu(counts) {
    let mentsu = 0;
    for (let i = 0; i < 34; i++) {
        if (counts[i] >= 3) {
            mentsu++;
            counts[i] -= 3;
        }
        if (i >= 7 && i < 25 && i % 9 < 7) {
            const seqCount = Math.min(counts[i], counts[i + 1], counts[i + 2]);
            if (seqCount > 0) {
                counts[i] -= seqCount;
                counts[i + 1] -= seqCount;
                counts[i + 2] -= seqCount;
                mentsu += seqCount;
            }
        }
    }
    return mentsu;
}

/**
 * Draws random tiles from a given tile set.
 *
 * Never used.
 * @param {number} count - Number of tiles to draw.
 * @param {number[]} tiles - Array of possible tile IDs.
 * @returns {number[]} - Randomly selected tiles.
 */
function drawTiles(count, tiles) {
    return Array(count).fill(0).map(() => tiles[Math.floor(Math.random() * tiles.length)]);
}

/**
 * Generates a random Mahjong hand for NNKR practice.
 * Ensures hand meets minimum shanten and meld requirements.
 * @param {number} [minShanten=1] - Minimum shanten allowed.
 * @param {number} [maxShanten=4] - Maximum shanten allowed.
 * @returns {{ hand: number[], shanten: number, mentsu: number, useHonors: boolean }}
 *  - hand: Array of 14 tile IDs
 *  - shanten: Shanten value
 *  - mentsu: Number of complete melds
 *  - useHonors: Whether honors are included in the hand
 */
export function generateProblem(minShanten = 1, maxShanten = 4) {
    while (true) {
        let hand = [];
        const useHonors = Math.random() < 0.3;

        if (useHonors) {
            const numSets = Math.floor(Math.random() * 3);
            for (let i = 0; i < numSets; i++) {
                const t = HONOR_TILES[Math.floor(Math.random() * HONOR_TILES.length)];
                const count = Math.random() < 0.5 ? 2 : 3;
                hand.push(...Array(count).fill(t));
            }
        }

        for (const suit of Object.values(SUIT_TILES)) {
            const dice = Math.random();
            if (dice < 0.4) {
                const start = suit[Math.floor(Math.random() * 7)];
                hand.push(start, start + 1, start + 2);
            } else if (dice < 0.75) {
                const start = suit[Math.floor(Math.random() * 8)];
                const second = Math.random() < 0.5 ? start + 1 : start + 2;
                hand.push(start, second);
            } else {
                hand.push(suit[Math.floor(Math.random() * 9)]);
            }
        }

        while (hand.length < 14) {
            const suit = Object.values(SUIT_TILES)[Math.floor(Math.random() * 3)];
            hand.push(suit[Math.floor(Math.random() * 9)]);
        }

        shuffle(hand);
        hand = hand.slice(0, 14);

        const counts = Array(34).fill(0);
        for (const t of hand) counts[t]++;

        const shanten = shantenNormal(counts);
        const mentsu = countMentsu([...counts]);

        if ((shanten <= minShanten && mentsu > 2) || (shanten > maxShanten && mentsu <= 1)) continue;

        return { hand, shanten, mentsu, useHonors };
    }
}
