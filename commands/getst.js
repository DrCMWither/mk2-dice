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
        function formatAttrValue(value) {
            if (value === null || value === undefined) return "";
            if (typeof value === "object") return JSON.stringify(value);
            return String(value);
        }

        function hasOwn(obj, key) {
            return Object.prototype.hasOwnProperty.call(obj, key);
        }

        // /getst all
        // /getst all someAttr
        if (parts.length > 1 && parts[1] === "all") {
            const queryKey = parts.slice(2).join(" ").trim();
            const allAttrs = await getAllAttributes(env, userId);

            if (!allAttrs || Object.keys(allAttrs).length === 0) {
                return "您在所有群都没有设置任何属性。";
            }

            if (queryKey) {
                const lines = [
                    `${escapeHtml(userName)} 在所有群中的属性 ${escapeHtml(queryKey)}：`
                ];

                let found = false;

                for (const [groupId, attrs] of Object.entries(allAttrs)) {
                    if (!attrs || typeof attrs !== "object") continue;
                    if (!hasOwn(attrs, queryKey)) continue;

                    found = true;
                    lines.push(
                        `群 ${escapeHtml(groupId)}: ${escapeHtml(formatAttrValue(attrs[queryKey]))}`
                    );
                }

                if (!found) {
                    return `${escapeHtml(userName)} 在所有群都没有属性 ${escapeHtml(queryKey)}。`;
                }

                return lines.join("\n");
            }

            const lines = [`${escapeHtml(userName)} 在所有群的属性：`];

            for (const [groupId, attrs] of Object.entries(allAttrs)) {
                lines.push(`\n群 ${escapeHtml(groupId)}:`);

                if (attrs && typeof attrs === "object") {
                    for (const [k, v] of Object.entries(attrs)) {
                        lines.push(`- ${escapeHtml(k)}: ${escapeHtml(formatAttrValue(v))}`);
                    }
                }
            }

            return lines.join("\n").trim();
        }

        // /getst hp
        const queryKey = parts.slice(1).join(" ").trim();

        // Default: current group
        const attrs = await getAttributes(env, userId, chatId);

        if (!attrs || Object.keys(attrs).length === 0) {
            return `您在群 ${escapeHtml(chatTitle || chatId)} 没有设置任何属性。`;
        }

        if (queryKey) {
            if (!hasOwn(attrs, queryKey)) {
                return `${escapeHtml(userName)} 在当前群没有属性 ${escapeHtml(queryKey)}。`;
            }

            return `${escapeHtml(userName)} 的 ${escapeHtml(queryKey)}：${escapeHtml(formatAttrValue(attrs[queryKey]))}`;
        }

        const lines = [`${escapeHtml(userName)} 在当前群的属性：`];

        for (const [k, v] of Object.entries(attrs)) {
            lines.push(`- ${escapeHtml(k)}: ${escapeHtml(formatAttrValue(v))}`);
        }

        return lines.join("\n").trim();
    } catch (err) {
        console.error("[ERROR] handleGetst failed:", err);
        return "获取属性时发生错误，请稍后再试。";
    }
}
