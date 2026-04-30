import { rollDice, parseDiceExpression, getQuantumRandomNumbers } from "../utils/dice.js";
import { getAttributes } from "../utils/storage.js";
import { escapeHtml } from "../utils/utils.js";

const MAX_TOTAL_ROLLS = 255;
const MAX_SIDES = 65535;

/**
 * Handles a dice roll command with advanced notation.
 *
 * Supports the following dice notation:
 *   /r NdM[*X][\pm Y]
 *   where:
 *     - C# = number of times to repeat the roll (default 1)
 *     - N = number of dice (default 1)
 *     - M = number of sides per die (default 6)
 *     - *X = multiplier (optional, default 1)
 *     - \pm Y = modifier (optional, default 0)
 *
 * Examples of valid commands:
 *   /r 3d6
 *   /r 2d10*2+5
 *   /r 3#d20*2 (repeats the d20 roll 3 times, multiplies the total by 2)
 *
 * @param {Object} env - The environment/context object for storage operations.
 * @param {string} message - The command message, e.g., "/r 3d6*2+1".
 * @param {string} userId - The unique identifier of the user issuing the roll.
 * @param {string} chatId - The unique identifier of the chat where the command is issued.
 * @param {string} userName - The display name of the user, can be overridden by stored nickname.
 * @param {boolean} [isQuantum=false] - If true, uses the quantum random number generator (ANU API) for dice rolls.
 * @returns {Promise<string>} - A formatted string showing the detailed dice roll and total.
 *
 * @example
 * await handleRoll(env, "/r 3d6", "123", "456", "Alice");
 *
 * @example
 * await handleRoll(env, "/r 2d10*2+5", "123", "456", "Alice");
 */
export async function handleRoll(env, message, userId, chatId, userName, isQuantum = false) {
    const match = message.match(/^\/(roll|r|rh|rq)(?:\s+(.*))?$/i);
    if (!match) return "格式错误，请使用 /r [C#]NdM[*X][+Y]";

    const expr = match[2] || "1d6";
    const parsed = parseDiceExpression(expr);
    if (!parsed) return "无法解析骰子表达式，请使用格式 [C#]NdM[*X][+Y]";

    const { count, sides, multiplier, modifier, repeat = 1 } = parsed;


    if (count * repeat > MAX_TOTAL_ROLLS) {
        return `骰子数量过多！`;
    }
    if (sides > MAX_SIDES) {
        return `骰子面数过多！`;
    }

    if (sides < 1 && count === 0) {
        return `🎲 ${escapeHtml(userName)} 的结果: ${modifier}`;
    }
    if (sides < 1) return "骰子的面数必须至少为 1!";

    const storedName = await getAttributes(env, userId, chatId, true);
    if (storedName) userName = storedName;

    const results = [];
    for (let i = 0; i < repeat; i++) {
        let rolls = [];

        if (isQuantum) {
            const totalCount = count * repeat;
            const quantumRolls = await getQuantumRandomNumbers(totalCount, sides);
            rolls = quantumRolls.slice(i * count, (i + 1) * count);
        } else {
            rolls = rollDice(count, sides);
        }

        const sum = rolls.reduce((a, b) => a + b, 0);
        const total = sum * multiplier + modifier;

        let diceNotation = `${count}d${sides}`;
        if (multiplier !== 1) diceNotation += `*${multiplier}`;
        if (modifier !== 0) diceNotation += (modifier > 0 ? "+" : "") + modifier;

        let expanded = rolls.join(" + ");
        if (multiplier !== 1) expanded = `(${expanded})*${multiplier}`;
        if (modifier !== 0) expanded += ` (${modifier > 0 ? "+" : ""}${modifier})`;

        results.push({ diceNotation, expanded, total });
    }

    let output = `🎲 ${escapeHtml(userName)} 的投掷结果:\n`;
    if (repeat > 1) {
        results.forEach((r, i) => {
            output += `#${i + 1}: ${r.diceNotation} = ${r.expanded} → 合计 ${r.total}\n`;
        });
        const grandTotal = results.reduce((a, b) => a + b.total, 0);
        output += `——\n总和: ${grandTotal}`;
    } else {
        const r = results[0];
        output += `${r.diceNotation} = ${r.expanded}\n合计: ${r.total}`;
    }

    if (isQuantum) {
        output += "\n该结果获取自量子缝隙中洞开的启示。该启示一分钟最多只能获取一次。"
    }

    return output.trim();
}