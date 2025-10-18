import { generateProblem } from "./nnkrHandler.js";
import { shuffle } from "../utils.js";
import { shantenNormal } from "./shantenCalculator.js";
import { improvementCount } from "./helper.js";

function gammaSample(shape = 2.5, scale = 3) {
    let sum = 0;
    for (let i = 0; i < shape; i++) sum += -Math.log(Math.random());
    return Math.round(sum * scale);
}

function nextTile(t) {
    if (t >= 0 && t <= 3) return (t + 1) % 4; // 东南西北
    if (t >= 4 && t <= 6) return (t + 1) % 3 + 4; // 中发白
    const mod9 = (t - 7) % 9;
    const base = t - mod9;
    return mod9 === 8 ? base : t + 1;
}

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
function gaussian(x, mu, sigma) {
    return Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
}


export function computeWeights(candidates, doraTiles, roundWind, seatWind, turn = 1) {
    const weights = [];
    const sigmaBase = 1.2;
    const sigma = sigmaBase + 0.3 * (turn - 1);

    for (const cand of candidates) {
        let weight = cand.improvements.length;

        const t = cand.discard;

             if (t <= 8)  weight *= gaussian(t + 1,  5, sigma);
        else if (t <= 17) weight *= gaussian(t - 8,  5, sigma);
        else if (t <= 26) weight *= gaussian(t - 17, 5, sigma);

        if (doraTiles.includes(t)) weight *= 0.4;

        if (t >= 27 && t <= 33) {
            if (t === roundWind || t === seatWind) weight *= 0.6;
            else weight *= 0.8;
        }

        weights.push(weight);
    }

    for (const dora of doraTiles) {
        for (let i = 0; i < candidates.length; i++) {
            const t = candidates[i].discard;
            if (dora <= 26 && t >= Math.floor(dora / 9) * 9 && t <= Math.floor(dora / 9) * 9 + 8) {
                if (Math.abs(t - dora) === 1 || Math.abs(t - dora) === 2) {
                    weights[i] *= 1.3;
                }
            }
        }
    }

    return weights;
}


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
