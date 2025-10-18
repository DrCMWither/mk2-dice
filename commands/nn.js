import {
    setAttribute,
    clearAttributes,
    clearAllAttributes,
} from "../utils/storage.js";

import { normalizeKey, escapeHtml } from "../utils/utils.js";

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
