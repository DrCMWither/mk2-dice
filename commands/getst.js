import { getAttributes, getAllAttributes } from "../utils/storage.js";

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

            let text = `${userName} 在所有群的属性：\n`;
            for (let [title, attrs] of Object.entries(allAttrs)) {
                text += `\n群 ${title || "未知"}:\n`;
                if (attrs && typeof attrs === "object") {
                    for (let [k, v] of Object.entries(attrs)) {
                        text += `- ${k}: ${v}\n`;
                    }
                }
            }
            return text.trim();
        }

        // 默认：当前群
        const attrs = await getAttributes(env, userId, chatId);
        if (!attrs || Object.keys(attrs).length === 0) {
            return `您在群 ${chatTitle || chatId} 没有设置任何属性。`;
        }

        let text = `${userName} 在当前群的属性：\n`;
        for (let [k, v] of Object.entries(attrs)) {
            text += `- ${k}: ${v}\n`;
        }
        return text.trim();
    } catch (err) {
        console.error("[ERROR] handleGetst failed:", err);
        return "获取属性时发生错误，请稍后再试。";
    }
}
