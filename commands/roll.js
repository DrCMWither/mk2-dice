import { rollDice, parseDiceExpression } from "../utils/dice.js";
import { getAttributes } from "../utils/storage.js";
import { escapeHtml } from "../utils/utils.js";

/**
 * Handles a dice roll command with advanced notation.
 *
 * Supports the following dice notation:
 *   /r NdM[*X][\pm Y]
 *   where:
 *     - N = number of dice (default 1)
 *     - M = number of sides per die (default 6)
 *     - *X = multiplier (optional, default 1)
 *     - \pm Y = modifier (optional, default 0)
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
    const match = message.match(/^\/(roll|r|rh)(?:\s+(.*))?$/i);
    if (!match) return "格式错误，请使用 /r NdM[*X][+Y]";

    const expr = match[2] || "1d6";
    const parsed = parseDiceExpression(expr);
    if (!parsed) return "无法解析骰子表达式，请使用格式 NdM[*X][+Y]";

    const { count, sides, multiplier, modifier } = parsed;

    const storedName = await getAttributes(env, userId, chatId, true);
    if (storedName) {
        userName = storedName;
    }

    if (sides < 1) return "骰子的面数必须至少为 1!";

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
