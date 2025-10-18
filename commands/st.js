import {
    setAttribute,
    deleteAttribute,
    clearAttributes,
    clearAllAttributes,
                   } from "../utils/storage.js";
import {  splitAttributes,
    normalizeKey
                   } from "../utils/utils.js";

export async function handleSt(env, message, userId, chatId, chatTitle) {
    message = splitAttributes(message);
    const parts = message.trim().split(/\s+/);

    // /st clear
    if (parts[1] === "clear") {
        await clearAttributes(env, userId, chatId);
        return `已清除您在群 ${chatTitle} 的属性。`;
    }

    // /st clearall
    if (parts[1] === "clearall") {
        await clearAllAttributes(env, userId);
        return "已清除您在所有群的属性。";
      }

    // /st del
    if (parts[1] === "del") {
        const attr = parts[2];
        if (!attr) return "请输入要删除的属性名";
        const key = await normalizeKey(env, attr);
        const ok = await deleteAttribute(env, userId, chatId, key);
        return ok
            ? `已删除您在群 ${chatTitle} 的属性「${attr}」。`
            : `没有找到属性「${attr}」。`;
    }

    // /st

    if (parts.length >= 3) {
        let reply = "已设置属性：\n";
        for (let i = 1; i < parts.length; i += 2) {
            const rawKey = parts[i];
            const value = parts[i + 1];
            if (!value) break;

            const key = await normalizeKey(env, rawKey);

            // Check value
            const num = Number(value);
            if (isNaN(num) || num < 0 || num > 99) {
                reply += `- ${rawKey}${rawKey !== key ? `（→${key}）` : ""} 的值无效，必须是 0~99 的数字，忽略\n`;
                continue;
            }

            await setAttribute(env, userId, chatId, key, num);

            // Construct display text
            reply += `- ${rawKey}${rawKey !== key ? `（→${key}）` : ""} = ${num}\n`;
        }
        return reply.trim();
    }
}
