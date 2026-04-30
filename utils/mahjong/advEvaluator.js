import { shantenNormal } from "./shantenCalculator.js";
import { countTiles, improvementCount } from "./helper.js";
import { remainingCountsFromVisible, winProb13 } from "./winProb.js";
import { estimateTileValue } from "./scoreEstimate.js";

function uniqueTiles(hand) {
    return [...new Set(hand)];
}

function countUkeire(improvements, remainingCounts) {
    return improvements.reduce((sum, t) => sum + remainingCounts[t], 0);
}

export function evaluateAdvancedDiscards(hand, ctx) {
    const visible = [
        ...(ctx.doraIndicators || []),
    ];

    const baseRemaining = remainingCountsFromVisible(hand, visible);
    const drawsLeft = Math.max(0, 18 - (ctx.turn || 1));

    const candidates = [];

    for (const discard of uniqueTiles(hand)) {
        const idx = hand.indexOf(discard);
        const hand13 = hand.slice(0, idx).concat(hand.slice(idx + 1));

        const shanten = shantenNormal(hand13);
        const improvements = improvementCount(hand13);
        const ukeire = countUkeire(improvements, baseRemaining);

        const memo = new Map();
        const winProb = winProb13(
            hand13,
            [...baseRemaining],
            Math.min(drawsLeft, Math.max(1, shanten + 2)),
            memo,
        );

        const avgTileValue =
            improvements.length === 0
                ? 0
                : improvements.reduce((sum, t) => sum + estimateTileValue(t, ctx), 0) / improvements.length;

        const expectedScore = Math.round(avgTileValue);
        const expectedValue = winProb * expectedScore;

        candidates.push({
            discard,
            shanten,
            improvements,
            waits: improvements,
            ukeire,
            winProb,
            expectedScore,
            expectedValue,
            reason: `和了率 ${(winProb * 100).toFixed(1)}%，进张 ${ukeire} 枚，估计打点 ${expectedScore} 点`,
        });
    }

    candidates.sort((a, b) =>
        b.expectedValue - a.expectedValue ||
        b.winProb - a.winProb ||
        b.ukeire - a.ukeire ||
        a.shanten - b.shanten,
    );

    const bestValue = candidates[0]?.expectedValue ?? 0;
    const eps = 1e-9;

    return {
        best: candidates
            .filter(c => Math.abs(c.expectedValue - bestValue) < eps)
            .map(c => c.discard),
        candidates,
    };
}