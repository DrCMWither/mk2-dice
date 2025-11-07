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