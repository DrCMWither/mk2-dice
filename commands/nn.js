import {
    setAttribute,
    clearAttributes,
    clearAllAttributes,
} from "../utils/storage.js";

import { normalizeKey, escapeHtml } from "../utils/utils.js";

/**
 * Handles user nickname commands in a chat.
 *
 * Supports the following subcommands:
 * 1. Setting a nickname: `/nn <nickname>`
 * 2. Clearing the nickname in the current chat: `/nn clear`
 * 3. Clearing nicknames in all chats: `/nn clearall`
 *
 * The function normalizes the nickname, stores it, and returns a confirmation message.
 * All output values are HTML-escaped to prevent injection issues.
 *
 * @param {Object} env - The environment/context object for storage operations.
 * @param {string} message - The command message, e.g., "/nn Alice" or "/nn clear".
 * @param {string} userId - The unique identifier of the user issuing the command.
 * @param {string} chatId - The unique identifier of the current chat.
 * @param {string} chatTitle - The title of the current chat, used for display purposes.
 * @param {string} userName - The display name of the user, used in messages.
 * @returns {Promise<string>} - A confirmation message describing the action taken.
 *
 * @example
 * // Set a nickname
 * await handleName(env, "/nn Alice", "123", "456", "Test Chat", "Bob");
 *
 * @example
 * // Clear the nickname in the current chat
 * await handleName(env, "/nn clear", "123", "456", "Test Chat", "Bob");
 *
 * @example
 * // Clear nicknames in all chats
 * await handleName(env, "/nn clearall", "123", "456", "Test Chat", "Bob");
 */
export async function handleName(env, message, userId, chatId, chatTitle, userName) {
    const parts = message.trim().split(/\s+/);

    if (parts.length < 2) {
        return "用法: /nn <昵称> 或 /nn clear /nn clearall";
    }

    const cmd = parts[1].toLowerCase();

    // /nn clear
    if (cmd === "clear") {
        await clearAttributes(env, userId, chatId, true);
        return `已清除您在群 ${escapeHtml(chatTitle)} 的昵称。`;
    }

    // /nn clearall
    if (cmd === "clearall") {
        await clearAllAttributes(env, userId, true);
        return "已清除您在所有群的昵称。";
    }

    const rawNickname = parts[1];
    const key = await normalizeKey(env, rawNickname);

    await setAttribute(env, userId, chatId, null, rawNickname, true);

    return `已设置 ${escapeHtml(userName)} 在群 ${escapeHtml(chatTitle)} 的昵称「${escapeHtml(rawNickname)}${escapeHtml(rawNickname) !== key ? ` → ${key}` : ""}」`;
}
