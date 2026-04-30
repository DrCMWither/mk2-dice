import { getAttributes         } from "../utils/storage.js";
import { normalizeKey          } from "../utils/utils.js";
import { rollDice              } from "../utils/dice.js";
import { escapeHtml, splitArgs } from "../utils/utils.js";

/**
 * Handles a random attribute check command.
 *
 * Rolls 1d100 to determine success or failure based on the user's attribute value.
 * Supports optional temporary values if the attribute is not found.
 * The function returns a formatted message describing the check result.
 *
 * Success thresholds:
 * - 1: Critical Success ("大成功")
 * - 2–floor(value/5): Extreme Success ("极难成功")
 * - floor(value/5)+1–floor(value/2): Hard Success ("困难成功")
 * - floor(value/2)+1–value: Success ("成功")
 * - >= value+1: Failure ("失败")
 * - 100: Critical Failure ("大失败")
 *
 * @param {Object} env - The environment/context object for storage operations.
 * @param {string} message - The command message, e.g., "/ra Strength 75".
 * @param {string} userId - The unique identifier of the user issuing the check.
 * @param {string} chatId - The unique identifier of the chat where the command is issued.
 * @param {string} userName - The display name of the user, can be overridden by stored nickname.
 * @returns {Promise<string>} - A formatted string describing the result of the attribute check.
 *
 * @example
 * // Perform a check using a stored attribute
 * await handleRa(env, "/ra Strength", "123", "456", "Alice");
 *
 * @example
 * // Perform a check with a temporary value
 * await handleRa(env, "/ra Luck 50", "123", "456", "Alice");
 */
export async function handleRa(env, message, userId, chatId, userName) {
    const parts = splitArgs(message);
    if (parts.length < 2) {
        return "用法: /ra <属性> [临时值]";
    }

    const storedName = await getAttributes(env, userId, chatId, true);
    if (storedName) {
        userName = storedName;
    }

    const rawAttrName  = parts[1];
    const tempValue    = parts[2] ? parseInt(parts[2], 10) : null;
    const attrName     = await normalizeKey(env, rawAttrName);

    // Load from KV
    const attrs = await getAttributes(env, userId, chatId);
    const value = attrs[attrName] ?? tempValue;

    if (!value || isNaN(value)) {
        return `未找到属性「${escapeHtml(rawAttrName)}」，也未提供临时值。`;
    }

    // 1d100
    const rollArr = rollDice(1, 100);
    const roll    = rollArr[0];

    let result = "";
    if (roll === 1) {
        result = "大成功";
    } else if (roll >= 99) {
        result = "大失败";
    } else if (roll <= Math.floor(value / 5)) {
        result = "极难成功";
    } else if (roll <= Math.floor(value / 2)) {
        result = "困难成功";
    } else if (roll <= value) {
        result = "成功";
    } else {
        result = "失败";
    }

    const displayName = rawAttrName !== attrName
        ? `${rawAttrName}（→${attrName}）`
        : rawAttrName;

    return `🎲 ${escapeHtml(userName)} 进行「${escapeHtml(displayName)}」检定\n结果: ${roll}/${value} → ${result}`;
}
