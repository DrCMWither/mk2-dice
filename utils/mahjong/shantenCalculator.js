
import { sortHand, countTiles } from "./helper.js";

/**
 * Computes the normal shanten number of a Mahjong hand.
 * Shanten number indicates how many tiles away the hand is from tenpai.
 * Lower shanten means closer to ready hand; -1 indicates a complete hand.
 *
 * @param {number[]} hand - Array of 14 tile IDs (0–33) representing the Mahjong hand.
 * @returns {number} - Shanten number (0–8, usually), minimal number of steps to complete hand.
 */
export function shantenNormal(hand) {
    const counts = countTiles(hand);
    let best = 8;

     /**
     * Recursive DFS to try all possible melds, pairs, and incomplete sets (tatsu).
     *
     * @param {number[]} counts - Current tile counts.
     * @param {number} mentsu - Number of complete melds (triplets or sequences) counted so far.
     * @param {number} tatsu - Number of incomplete sets (two-tile sequences) counted so far.
     * @param {boolean} pair - Whether a pair (eyes) has been formed.
     * @param {number} idx - Current tile index being processed.
     */
    function dfs(counts, mentsu, tatsu, pair, idx) {
        if (idx >= 34) {
            const needMentsu = Math.max(0, 4 - mentsu);
            const needPair = pair ? 0 : 1;
            const shanten = needMentsu * 2 + needPair - tatsu;
            best = Math.min(best, shanten);
            return;
        }

        // Skip empty tiles
        if (counts[idx] === 0) {
            dfs(counts, mentsu, tatsu, pair, idx + 1);
            return;
        }

        // Try forming a pair
        if (!pair && counts[idx] >= 2) {
            counts[idx] -= 2;
            dfs(counts, mentsu, tatsu, true, idx);
            counts[idx] += 2;
        }

        // Try forming a triplet
        if (counts[idx] >= 3) {
            counts[idx] -= 3;
            dfs(counts, mentsu + 1, tatsu, pair, idx);
            counts[idx] += 3;
        }

        // Try suitbase
        let suitBase = null;
        if (idx >= 7 && idx <= 15) suitBase = 7;    // 万 7..15
        else if (idx >= 16 && idx <= 24) suitBase = 16; // 索 16..24
        else if (idx >= 25 && idx <= 33) suitBase = 25; // 饼 25..33

        if (suitBase !== null) {
            const offset = idx - suitBase;

            if (offset <= 6 && counts[idx + 1] > 0 && counts[idx + 2] > 0) {
                counts[idx]--; counts[idx + 1]--; counts[idx + 2]--;
                dfs(counts, mentsu + 1, tatsu, pair, idx);
                counts[idx]++; counts[idx + 1]++; counts[idx + 2]++;
            }

            if (offset <= 7 && counts[idx + 1] > 0) {
                counts[idx]--; counts[idx + 1]--;
                dfs(counts, mentsu, tatsu + 1, pair, idx);
                counts[idx]++; counts[idx + 1]++;
            }

            if (offset <= 6 && counts[idx + 2] > 0) {
                counts[idx]--; counts[idx + 2]--;
                dfs(counts, mentsu, tatsu + 1, pair, idx);
                counts[idx]++; counts[idx + 2]++;
            }
        }

        counts[idx]--;
        dfs(counts, mentsu, tatsu, pair, idx);
        counts[idx]++;
    }

    dfs(counts, 0, 0, false, 0);
    return best;
}