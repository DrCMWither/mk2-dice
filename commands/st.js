/* import {
          setAttribute,
          deleteAttribute,
          clearAttributes,
          clearAllAttributes,
                         } from "../utils/storage.js"; */
import {  splitAttributes,
          normalizeKey,
          escapeHtml
                         } from "../utils/utils.js";


/**
 * Handles setting, deleting, and clearing user attributes in a group.
 *
 * Supported commands:
 * - "/st clear": Clear all attributes of the user in the current group.
 * - "/st clearall": Clear all attributes of the user in all groups.
 * - "/st del <attribute>": Delete a specific attribute of the user in the current group.
 * - "/st <attr1> <value1> <attr2> <value2> ...": Set one or multiple attributes (0-99) for the user in the current group.
 *
 * Attribute keys are normalized, and invalid values (non-numeric or out of 0-99) are ignored.
 *
 * @param {Object} env - The environment/context object, providing KV storage access.
 * @param {string} message - The command message, e.g., "/st Strength 50 Luck 30".
 * @param {string} userId - The unique identifier of the user performing the command.
 * @param {string} chatId - The unique identifier of the chat/group.
 * @param {string} chatTitle - The display title of the chat/group.
 * @returns {Promise<string>} - A response message describing the result of the operation.
 *
 * @example
 * await handleSt(env, "/st Strength 50 Luck 30", "123", "456", "Adventurers");
 *
 * @example
 * await handleSt(env, "/st clear", "123", "456", "Adventurers");
 *
 * @example
 * await handleSt(env, "/st del Strength", "123", "456", "Adventurers");
 */
export async function handleSt(env, message, userId, chatId, chatTitle) {
    message = splitAttributes(message);
    const parts = message.trim().split(/\s+/);

    const groupKey = `group:${chatId}`;
    const groupData = (await env.KV.get(groupKey, "json")) || {};
    const userData = groupData[userId] || {};

    // clear
    if (parts[1] === "clear") {
        delete groupData[userId];
        await env.KV.put(groupKey, JSON.stringify(groupData));
        return `已清除您在群 ${chatTitle} 的属性。`;
    }

    // clearall
    if (parts[1] === "clearall") {
        const allKeys = await env.KV.list({ prefix: "group:" });
        for (const { name } of allKeys.keys) {
            const data = (await env.KV.get(name, "json")) || {};
            delete data[userId];
            await env.KV.put(name, JSON.stringify(data));
        }
        return "已清除您在所有群的属性。";
    }

    // del
    if (parts[1] === "del") {
        const attr = parts[2];
        if (!attr) return "请输入要删除的属性名";
        const key = await normalizeKey(env, attr);

        if (userData[key] !== undefined) {
            delete userData[key];
            groupData[userId] = userData;
            await env.KV.put(groupKey, JSON.stringify(groupData));
            return `已删除您在群 ${escapeHtml(chatTitle)} 的属性「${escapeHtml(attr)}」。`;
        } else {
            return `没有找到属性「${escapeHtml(attr)}」。`;
        }
    }

    // st
    if (parts.length >= 3) {
        let reply = "已设置属性：\n";
        for (let i = 1; i < parts.length; i += 2) {
            const rawKey = parts[i];
            const value = parts[i + 1];
            if (!value) break;

            const key = await normalizeKey(env, rawKey);
            const num = Number(value);
            if (isNaN(num) || num < 0 || num > 99) {
                reply += `- ${escapeHtml(rawKey)}${rawKey !== key ? `（→${key}）` : ""} 的值无效，必须是 0~99 的数字，忽略\n`;
                continue;
            }

            userData[key] = num;
            reply += `- ${escapeHtml(rawKey)}${rawKey !== key ? `（→${key}）` : ""} = ${num}\n`;
        }

        groupData[userId] = userData;
        await env.KV.put(groupKey, JSON.stringify(groupData));
        return reply.trim();
    }
}
