import { getAttributes, setAttribute } from "../utils/storage.js";
import { rollDice, parseDiceExpression } from "../utils/dice.js";
import { normalizeKey,escapeHtml } from "../utils/utils.js";

/**
 * Handles a sanity check command (/sc) for a user.
 *
 * Performs a POW/Will check against a user’s Will attribute.
 * If the check fails, reduces the Sanity attribute based on the given expressions.
 *
 * @param {Object} env - The environment/context object for storage operations.
 * @param {string} message - The command message, e.g., "/sc 1/1d6".
 *                           Format: <expression1>/<expression2>
 *                           expression1 = value deducted on success
 *                           expression2 = value deducted on failure
 * @param {string} userId - The unique identifier of the user performing the check.
 * @param {string} chatId - The unique identifier of the chat where the command is issued.
 * @param {string} userName - The display name of the user, can be overridden by stored nickname.
 * @returns {Promise<string>} - A formatted string describing the roll, result, and sanity reduction.
 *
 * @example
 * await handleSc(env, "/sc 1d6/2d6", "123", "456", "Alice");
 */
export async function handleSc(env, message, userId, chatId, userName) {
    const parts = message.trim().split(/\s+/);
    if (parts.length < 2) {
        return "用法: /sc <表达式1|表达式2>";
    }

    const storedName = await getAttributes(env, userId, chatId, true);
    if (storedName) userName = storedName;

    const exprParts = parts[1].split("/");
    if (exprParts.length !== 2) return "表达式格式错误，应为 <表达式1>/<表达式2>";

    const expr1 = exprParts[0];
    const expr2 = exprParts[1];

    const attrs     = await getAttributes(env, userId, chatId);
    const willKey   = await normalizeKey(env, "意志");
    const sanityKey = await normalizeKey(env, "理智");

    if (!(willKey in attrs) || !(sanityKey in attrs)) {
        return `未找到所需属性「意志」或「理智」。`;
    }

    const willValue = attrs[willKey];

    // POW Check
    const roll = 1 + Math.floor(Math.random() * 100);
    let result = "";
    if (roll === 1) result = "大成功";
    else if (roll >= 99) result = "大失败";
    else if (roll <= Math.floor(willValue / 5)) result = "极难成功";
    else if (roll <= Math.floor(willValue / 2)) result = "困难成功";
    else if (roll <= willValue) result = "成功";
    else result = "失败";

    const reduceExpr = ["大成功", "极难成功", "困难成功", "成功"].includes(result)
        ? expr1
        : expr2;

    const parsed = parseDiceExpression(reduceExpr);
    if (!parsed) return `无法解析表达式: ${reduceExpr}`;

    const { count, sides, multiplier, modifier } = parsed;
    const rolls = rollDice(count, sides);
    const sum = rolls.reduce((a, b) => a + b, 0);
    const reduceValue = sum * multiplier + modifier;

    const newSanity = Math.max(0, attrs[sanityKey] - reduceValue);
    await setAttribute(env, userId, chatId, sanityKey, newSanity);

    return `🎲 ${escapeHtml(userName)} 进行「${willKey}」检定\n结果: ${roll}/${willValue} → ${result}\n${sanityKey}减少：${reduceValue}\n${attrs[sanityKey]} → ${newSanity}`;
}
