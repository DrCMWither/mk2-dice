import { rollDice } from "../utils/dice.js";
import { getAttributes } from "../utils/storage.js";
import { escapeHtml } from "../utils/utils.js";

/**
 * Handles a dice roll command with advanced notation.
 *
 * Supports the following dice notation:
 *   /r NdM[*X][+Y]
 *   where:
 *     - N = number of dice (default 1)
 *     - M = number of sides per die (default 6)
 *     - *X = multiplier (optional, default 1)
 *     - +Y = modifier (optional, default 0)
 *
 * Examples of valid commands:
 *   /r 3d6
 *   /r 2d10*2+5
 *
 * @param {Object} env - The environment/context object for storage operations.
 * @param {string} message - The command message, e.g., "/r 3d6*2+1".
 * @param {string} userId - The unique identifier of the user issuing the roll.
 * @param {string} chatId - The unique identifier of the chat where the command is issued.
 * @param {string} userName - The display name of the user, can be overridden by stored nickname.
 * @returns {Promise<string>} - A formatted string showing the detailed dice roll and total.
 *
 * @example
 * await handleRoll(env, "/r 3d6", "123", "456", "Alice");
 *
 * @example
 * await handleRoll(env, "/r 2d10*2+5", "123", "456", "Alice");
 */
export async function handleRoll(env, message, userId, chatId, userName) {
    const parts = message.match(/^\/(roll|r|rh)(?:\s+(\d*)d(\d+)(?:\*(\d+))?([+-]\d+)?)?$/i);
    if (!parts) return "格式错误，请使用 /r NdM[*X][+Y]";

    const storedName = await getAttributes(env, userId, chatId, true);
    if (storedName) {
        userName = storedName;
    }

    let count      = parts[2] ? parseInt(parts[2], 10) : 1;
    let sides      = parts[3] ? parseInt(parts[3], 10) : 6;
    let multiplier = parts[4] ? parseInt(parts[4], 10) : 1;
    let modifier   = parts[5] ? parseInt(parts[5], 10) : 0;

    if (sides < 1) return "骰子的面数必须至少为 1!";

    if (count > 50) count = 50;
    if (count < 1 ) count = 1;

    const rolls = rollDice(count, sides);
    const sum   = rolls.reduce((a, b) => a + b, 0);
    const total = sum * multiplier + modifier;

    let diceNotation = `${count}d${sides}`;
    if (multiplier !== 1) diceNotation += `*${multiplier}`;
    if (modifier !== 0) diceNotation += (modifier > 0 ? "+" : "") + modifier;

    let expanded = rolls.join(" + ");
    if (multiplier !== 1) expanded = `(${expanded})*${multiplier}`;
    if (modifier !== 0) expanded += ` (${modifier > 0 ? "+" : ""}${modifier})`;

    return `🎲 ${escapeHtml(userName)} 的投掷结果: ${diceNotation} = ${expanded}\n合计: ${total}`;
}
