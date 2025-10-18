import { getAttributes, getAllAttributes } from "../utils/storage.js";
import { escapeHtml } from "../utils/utils.js";

/**
 * Handles the retrieval of user attributes in a chat context.
 *
 * Depending on the message content, this function can fetch:
 * 1. Attributes for the current chat.
 * 2. Attributes across all chats (if "all" is specified).
 *
 * It also attempts to fetch a stored user display name.
 * All output values are HTML-escaped to prevent injection issues.
 *
 * @param {Object} env - The environment/context object for storage operations.
 * @param {string} message - The command message, e.g., "/getst" or "/getst all".
 * @param {string} userId - The unique identifier of the user requesting attributes.
 * @param {string} chatId - The unique identifier of the current chat.
 * @param {string} chatTitle - The title of the current chat, used for display purposes.
 * @param {string} [userName] - Optional display name of the user; can be overridden by stored name.
 * @returns {Promise<string>} - A formatted string containing the user's attributes, or an error message if retrieval fails.
 *
 * @example
 * // Retrieve attributes in the current chat
 * await handleGetst(env, "/getst", "123", "456", "Test Chat", "Alice");
 *
 * @example
 * // Retrieve attributes in all chats
 * await handleGetst(env, "/getst all", "123", "456", "Test Chat", "Alice");
 */
export async function handleGetst(env, message, userId, chatId, chatTitle, userName) {
    // Parameters check
    if (!env || !userId || !chatId) {
        return "无法获取用户或群信息。";
    }

    const parts = (message || "").trim().split(/\s+/);

    try {
        // Try to get storaged surname
        const storedName = await getAttributes(env, userId, chatId, true);
        if (storedName && typeof storedName === "string") {
            userName = storedName;
        }

        // /getst all
        if (parts.length > 1 && parts[1] === "all") {
            const allAttrs = await getAllAttributes(env, userId);
            if (!allAttrs || Object.keys(allAttrs).length === 0) {
                return "您在所有群都没有设置任何属性。";
            }

            let text = `${escapeHtml(userName)} 在所有群的属性：\n`;
            for (let [title, attrs] of Object.entries(allAttrs)) {
                text += `\n群 ${escapeHtml(title || "未知")}:\n`;
                if (attrs && typeof attrs === "object") {
                    for (let [k, v] of Object.entries(attrs)) {
                        text += `- ${k}: ${v}\n`;
                    }
                }
            }
            return text.trim();
        }

        // Default: current group
        const attrs = await getAttributes(env, userId, chatId);
        if (!attrs || Object.keys(attrs).length === 0) {
            return `您在群 ${escapeHtml(chatTitle) || chatId} 没有设置任何属性。`;
        }

        let text = `${escapeHtml(userName)} 在当前群的属性：\n`;
        for (let [k, v] of Object.entries(attrs)) {
            text += `- ${escapeHtml(k)}: ${escapeHtml(v)}\n`;
        }
        return text.trim();
    } catch (err) {
        console.error("[ERROR] handleGetst failed:", err);
        return "获取属性时发生错误，请稍后再试。";
    }
}
