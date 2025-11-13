/**
 * Roll n dice with m sides each.
 *
 * @param {number} n - Number of dice to roll.
 * @param {number} m - Number of sides on each die (must be \geq 1).
 * @returns {number[]} Array of length n with each die result (1–m).
 */
export function rollDice(n, m) {
    const rolls = [];
    for (let i = 0; i < n; i++) {
        rolls.push(Math.floor(Math.random() * m) + 1);
    }
    return rolls;
}

/**
 * Parse the expression of a dice (e.g., "3d6*2+5").
 * @param {string} expr - The expression of the dice.
 * @returns {object | null} Parse result or null
 */
export function parseDiceExpression(expr) {
    expr = expr.trim();
    const full = /^(\d+)#\(?(.+?)\)?$/;
    const match = expr.match(full);
    if (match) {
        const repeat = parseInt(match[1], 10);
        const innerExpr = match[2].trim();
        const parsedInner = parseDiceExpression(innerExpr);
        if (!parsedInner) return null;
        return { ...parsedInner, repeat };
    }

    // Handle constants (reqd. by @function )
    if (/^\d+$/.test(expr)) {
        const val = parseInt(expr, 10);
        return { count: 0, sides: 0, multiplier: 1, modifier: val, repeat: 1 };
    }

    const pattern = /^(\d*)d(\d+)(?:\*(\d+))?([+-]\d+)?$/i;
    const parts = expr.match(pattern);
    if (!parts) return null;

    const count      = parts[1] ? parseInt(parts[1], 10) : 1;
    const sides      = parseInt(parts[2], 10);
    const multiplier = parts[3] ? parseInt(parts[3], 10) : 1;
    const modifier   = parts[4] ? parseInt(parts[4], 10) : 0;

    if (sides < 1 || count < 1) return null;

    return { count, sides, multiplier, modifier, repeat: 1 };
}

/**
 * Fetches quantum random numbers from the ANU Quantum Random Number Generator API.
 *
 * @param {number} totalCount - The total number of random numbers to generate (max 1000 per request).
 * @param {number} sides - The number of sides for the dice (determines the range [1, sides]).
 * @returns {number[]} An array of `totalCount` random integers, each in the range [1, sides].
 * @throws {Error} If the API request fails or returns invalid data.
 *
 * @example
 * // Get 5 dice rolls for a 6-sided die
 * const rolls = await getQuantumRandomNumbers(5, 6);
 * // Returns: [3, 1, 5, 2, 6] (example output)
 */
export async function getQuantumRandomNumbers(totalCount, sides) {
    const response = await fetch(`https://qrng.anu.edu.au/API/jsonI.php?length=${totalCount}&type=uint8&size=${sides}`);
    const data = await response.json();
    return data.data.slice(0, totalCount).map(num => (num % sides) + 1);
}