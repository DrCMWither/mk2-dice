import { getAttributes } from "../utils/storage.js";
import  { isAdmin } from "../utils/message.js";

/**
 * Manages group-specific custom card decks with subcommands for viewing, creating, and deleting decks.
 *
 * @async
 * @param {Object} env - Environment object containing bindings (e.g., KV storage)
 * @param {string} message - Full command message (e.g., "/deck show", "/deck new DeckName=Entry1|Entry2")
 * @param {string} userId - User identifier for permission checks
 * @param {string} chatId - Group identifier for group-specific data
 * @param {string} userName - Current username (may be overridden by stored name)
 * @returns {Promise<string>} Status message indicating operation result or error
 *
 * @example
 * // User sends: "/deck show"
 * // Returns: "本群的自定义卡组如下：\n\n塔罗（3 条目）\n占卜（5 条目)"
 *
 * @example
 * // Admin sends: "/deck new 塔罗=魔术师|命运之轮|月亮"
 * // Returns: "管理员 Alice 已为本群创建卡组 "塔罗"，共 3 条目。"
 *
 * @example
 * // Admin sends: "/deck clearall"
 * // Returns: "管理员 Alice 已清除本群的全部自定义卡组。"
 *
 * @example
 * // Admin sends: "/deck clear 塔罗"
 * // Returns: "管理员 Alice 已删除卡组 "塔罗"。"
 */
export async function handleDeck(env, message, userId, chatId, userName) {
    const parts = message.trim().split(/\s+/);

    const storedName = await getAttributes(env, userId, chatId, true);
    if (storedName) userName = storedName;

    if (!parts[1]) {
        return "用法: /deck show|new|clear|clearall [可选参数]";
    }

    if (parts[1] === "show") {
        const existing = await env.KV.get(`group:${chatId}`);
        if (!existing) return "本群还没有创建任何自定义卡组。";

        let groupData;
        try {
            groupData = JSON.parse(existing);
        } catch {
            return "数据损坏，无法读取群卡组。";
        }

        const decks = groupData.group_custom_cards || {};
        const deckNames = Object.keys(decks);
        if (deckNames.length === 0) return "本群目前没有任何自定义卡组。";

        const summary = deckNames
            .map(name => `${name}（${Object.keys(decks[name]).length} 条目）`)
            .join("\n");

        return `本群的自定义卡组如下：\n\n${summary}`;
    }

    if (parts[1] === "new") {
        const admin = await isAdmin(userId, chatId);
        if (!admin) return "只有管理员才能创建新卡组。";

        const rest = parts.slice(2).join(" ").trim();
        const match = rest.match(/^([^=]+)=([\s\S]+)$/);
        if (!match) return "格式错误，应为：卡组名=条目1|条目2|条目3";

        const groupDeckName = match[1].trim();
        const groupCardsRaw = match[2].trim();
        const groupCardsArray = groupCardsRaw.split("|").map(s => s.trim()).filter(Boolean);
        if (groupCardsArray.length === 0) return "至少需要一个条目。";

        const groupDeckObj = {};
        groupCardsArray.forEach((item, i) => {
            groupDeckObj[i + 1] = { name: item };
        });

        const key = `group:${chatId}`;
        let groupData = {};

        const existing = await env.KV.get(key);
        if (existing) {
            try {
                groupData = JSON.parse(existing);
            } catch {
                groupData = {};
            }
        }
        if (typeof groupData.group_custom_cards !== "object" || groupData.group_custom_cards === null) {
            groupData.group_custom_cards = {};
        }

        groupData.group_custom_cards[groupDeckName] = groupDeckObj;
        await env.KV.put(key, JSON.stringify(groupData));
        return `管理员 ${userName} 已为本群创建卡组 "${groupDeckName}"，共 ${groupCardsArray.length} 条目。`;
    }

    if (parts[1] === "clearall") {
        const admin = await isAdmin(userId, chatId);
        if (!admin) return "只有管理员才能清除全部卡组。";

        const existing = await env.KV.get(`group:${chatId}`);
        let groupData = {};
        if (existing) {
            groupData = JSON.parse(existing);
        }

        groupData.group_custom_cards = {};

        await env.KV.put(`group:${chatId}`, JSON.stringify(groupData));
        return `管理员 ${userName} 已清除本群的全部自定义卡组。`;
    }

    if (parts[1] === "clear") {
        const admin = await isAdmin(userId, chatId);
        if (!admin) return "只有管理员才能删除卡组。";

        const deckName = parts.slice(2).join(" ").trim();
        if (!deckName) return "请指定要删除的卡组名称。";

        const existing = await env.KV.get(`group:${chatId}`);
        if (!existing) return "本群尚未创建任何自定义卡组。";

        let groupData;
        try {
            groupData = JSON.parse(existing);
        } catch {
            return "数据损坏，无法读取群卡组。";
        }

        if (!groupData.group_custom_cards || !groupData.group_custom_cards[deckName]) {
            return `未找到卡组 "${deckName}"。`;
        }

        delete groupData.group_custom_cards[deckName];
        await env.KV.put(`group:${chatId}`, JSON.stringify(groupData));
        return `管理员 ${userName} 已删除卡组 "${deckName}"。`;
    }
}