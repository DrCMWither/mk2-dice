import { rollDice } from "../utils/dice.js";
import { getAttributes } from "../utils/storage.js";
import { escapeHtml } from "../utils/utils.js";

/**
 * Generates a random "today's luck" (a value between 1 and 100) for a user,
 * retrieves the user's stored name if available, and returns a message.
 * including the user's name and their roll result.
 *
 * @param {Object} env - The environment object, typically containing configuration or context.
 * @param {string} userId - The unique ID of the user.
 * @param {string} chatId - The unique ID of the chat.
 * @param {string} userName - The name of the user. If a stored name is found, it will override this value.
 * @returns {Promise<string>} A promise that resolves to a string containing the user's name and their roll result.
 */
export async function jrrp(env, userId, chatId, userName) {
    const storedName = await getAttributes(env, userId, chatId, true);
    if (storedName) userName = storedName;
    const rolls = rollDice(1, 100);
    return `${escapeHtml(userName)} 的今日人品： \n${rolls[0]}`;

}