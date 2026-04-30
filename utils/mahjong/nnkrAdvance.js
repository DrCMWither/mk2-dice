import { generateProblem } from "./nnkrHandler.js";
import { shuffle } from "../utils.js";
import { shantenNormal } from "./shantenCalculator.js";
import { improvementCount } from "./helper.js";

/**
 * Samples a value from a Gamma-like distribution.
 * @param {number} shape - Shape parameter (k), default 2.5.
 * @param {number} scale - Scale parameter (θ), default 3.
 * @returns {number} - Rounded gamma-distributed sample.
 */
function gammaSample(shape = 2.5, scale = 3) {
    let sum = 0;
    for (let i = 0; i < shape; i++) sum += -Math.log(Math.random());
    return Math.round(sum * scale);
}

/**
 * Returns the next tile in sequence (used for Dora indicator calculation).
 * @param {number} t - Tile ID (0–33).
 * @returns {number} - Tile ID of the next tile.
 */
function nextTile(t) {
    if (t >= 0 && t <= 3) return (t + 1) % 4; // 东南西北
    if (t >= 4 && t <= 6) return (t + 1) % 3 + 4; // 中发白
    const mod9 = (t - 7) % 9;
    const base = t - mod9;
    return mod9 === 8 ? base : t + 1;
}

/**
 * Generates a random set of Dora indicators and corresponding Dora tiles.
 * @returns {{ indicators: number[], doraTiles: number[] }} - Indicators and Dora tiles.
 */
function generateDora() {
    const numDora = Math.ceil(Math.random() * 3); // 1–4
    const indicators = [];
    while (indicators.length < numDora) {
        const t = Math.floor(Math.random() * 34);
        if (!indicators.includes(t)) indicators.push(t);
    }
    const doraTiles = indicators.map(nextTile);
    return { indicators, doraTiles };
}

/**
 * Computes Gaussian probability density.
 * @param {number} x - Input value.
 * @param {number} mu - Mean.
 * @param {number} sigma - Standard deviation.
 * @returns {number} - Gaussian value.
 */
function gaussian(x, mu, sigma) {
    return Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
}

/**
 * Computes discard weights for advanced problem selection.
 *
 * Higher weight means this discard is more likely to be considered plausible
 * under the current advanced context.
 *
 * @param {Array<{discard: number, improvements: number[]}>} candidates
 * @param {number[]} doraTiles
 * @param {number} roundWind
 * @param {number} seatWind
 * @param {number} [turn=1]
 * @returns {number[]}
 */
export function computeWeights(candidates, doraTiles, roundWind, seatWind, turn = 1) {
    const weights = [];

    const sigmaBase = 1.2;
    const sigma = sigmaBase + 0.3 * (turn - 1);

    for (const cand of candidates) {
        const t = cand.discard;

        let weight = Math.max(1, cand.improvements.length);

        const suit = tileSuit(t);
        const num = tileNumber(t);

        if (suit !== "z" && num !== null) {
            const middleAffinity = gaussian(num, 5, sigma);

            weight *= 1.2 - 0.7 * middleAffinity;
        }

        if (doraTiles.includes(t)) {
            weight *= 0.35;
        }

        if (isHonor(t)) {
            if (t === roundWind || t === seatWind) {
                weight *= 0.55;
            } else if (isDragon(t)) {
                weight *= 0.75;
            } else {
                weight *= 1.05;
            }
        }

        weights.push(weight);
    }
    for (const dora of doraTiles) {
        for (let i = 0; i < candidates.length; i++) {
            const t = candidates[i].discard;

            if (!isSameNumberSuit(t, dora)) continue;

            const dt = tileNumber(dora);
            const nt = tileNumber(t);

            if (Math.abs(nt - dt) === 1 || Math.abs(nt - dt) === 2) {
                weights[i] *= 0.75;
            }
        }
    }

    return weights;
}

/**
 * Generates an advanced Mahjong discard problem for NNKR practice.
 * @param {number} [minShanten=1] - Minimum shanten value for problem hand.
 * @param {number} [maxShanten=4] - Maximum shanten value for problem hand.
 * @returns {object} - Problem object containing:
 *  - hand: number[] - Hand tiles
 *  - shanten: number - Current shanten
 *  - mentsu: array - Meld structure
 *  - useHonors: boolean
 *  - doraIndicators: number[]
 *  - doraTiles: number[]
 *  - roundWind: number
 *  - seatWind: number
 *  - turn: number
 *  - weights: number[] - Computed discard weights
 */
export function generateAdvancedProblem(minShanten = 1, maxShanten = 4) {
    const { hand, shanten, mentsu, useHonors } = generateProblem(minShanten, maxShanten);
    const { indicators, doraTiles } = generateDora();

    const roundWind = Math.floor(Math.random() * 2);
    const seatWind = Math.floor(Math.random() * 4);

    const turn = Math.min(15, Math.max(1, gammaSample()));

    const candidates = [];
    let bestShanten = Infinity;

    for (let i = 0; i < hand.length; i++) {
        const newHand = hand.slice(0, i).concat(hand.slice(i + 1));
        const s = shantenNormal(newHand);
        if (s < bestShanten) bestShanten = s;
    }

    for (let i = 0; i < hand.length; i++) {
        const newHand = hand.slice(0, i).concat(hand.slice(i + 1));
        const s = shantenNormal(newHand);
        if (s === bestShanten) {
            const imps = improvementCount(newHand);
            candidates.push({ discard: hand[i], shanten: s, improvements: imps });
        }
    }

    const weights = computeWeights(candidates, doraTiles, roundWind, seatWind, turn);

    return {
        hand,
        shanten,
        mentsu,
        useHonors,
        doraIndicators: indicators,
        doraTiles,
        roundWind,
        seatWind,
        turn,
        weights
    };
}
