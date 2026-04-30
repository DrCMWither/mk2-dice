import { isHonor, isTerminal } from "./tileModel.js";

export function estimateTileValue(tile, ctx) {
    let value = 1000;

    if (ctx.doraTiles?.includes(tile)) value += 2000;

    if (tile === ctx.roundWind) value += 900;
    if (tile === ctx.seatWind) value += 900;

    if (isHonor(tile)) value += 300;
    if (isTerminal(tile)) value -= 100;

    return value;
}

export function estimateHandScore(hand14, winningTile, ctx) {
    let score = 1000;

    for (const t of hand14) {
        if (ctx.doraTiles?.includes(t)) score += 2000;
    }

    if (winningTile === ctx.roundWind) score += 900;
    if (winningTile === ctx.seatWind) score += 900;

    // need tanpin / yakuhai / chitoi / honitsu and yaku like detect.
    return Math.max(1000, score);
}