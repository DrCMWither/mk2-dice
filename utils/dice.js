/**
 * Roll n dice with m sides each.
 *
 * @param {number} n - Number of dice to roll.
 * @param {number} m - Number of sides on each die (must be ≥1).
 * @returns {number[]} Array of length n with each die result (1–m).
 */
export function rollDice(n, m) {
    const rolls = [];
    for (let i = 0; i < n; i++) {
        rolls.push(Math.floor(Math.random() * m) + 1);
    }
    return rolls;
}
