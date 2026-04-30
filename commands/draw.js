import { rollDice } from "../utils/dice.js";
import { getAttributes } from "../utils/storage.js";
import { normalizeKey, splitArgs } from "../utils/utils.js";

/**
 * Handles the card draw command (e.g., `/draw [deck]`). Retrieves a random card from the specified deck.
 *
 * @async
 * @param {Object} env - Environment object containing bindings (e.g., KV storage)
 * @param {string} message - Full message string (e.g., "/draw 塔罗")
 * @param {string} userId - User identifier for storage lookups
 * @param {string} chatId - Chat identifier for storage lookups
 * @param {string} userName - Current username (may be overridden by stored name)
 * @returns {Promise<string>} Formatted result string with card details or error message
 *
 * @example
 * // Example usage:
 * // User sends: "/draw 塔罗"
 * // Returns: "Alice 抽取了 塔罗：\n\n🎴 The Magician\n正位：You have the power to manifest your desires"
 *
 * @throws {Error} - If deck data is missing, invalid, or JSON parsing fails
 *
 **/
export async function handleDraw(env, message, userId, chatId, userName) {
    const parts = splitArgs(message);
    let deckKind = await normalizeKey(env, parts[1]) || "塔罗";
    if (!deckKind) {
        return "请指定要抽取的卡组，例如：`/draw 塔罗`。";
    }

    const storedName = await getAttributes(env, userId, chatId, true);
    if (storedName) userName = storedName;

    try {
        const raw = await env.KV.get("drawDeck");
        if (!raw) {
            return "未找到任何卡组数据。";
        }

        let allDecks;
        try {
            allDecks = JSON.parse(raw);
        } catch {
            return "卡组数据格式错误（JSON 无法解析）。";
        }

        const deck = allDecks[deckKind];
        if (!deck || typeof deck !== "object") {
            return `未找到卡组 "${deckKind}"，请确认名称是否正确。`;
        }

        const keys = Object.keys(deck);
        const size = keys.length;
        if (size === 0) {
            return `卡组 "${deckKind}" 为空。`;
        }

        const roll = rollDice(1, size);
        const index = Number(roll[0]) || 1;
        const card = deck[index] || deck[keys[index - 1]];
        if (!card) {
            return `抽取错误（索引 ${index}）。`;
        }

        let orientation = "";
        let meaning = "";

        if ("upright" in card || "reversed" in card) {
            const orientationRoll = rollDice(1, 2);
            const isReversed = Array.isArray(orientationRoll) && orientationRoll[0] === 2;
            orientation = isReversed ? "逆位：" : "正位：";
            meaning = isReversed ? (card.reversed || "") : (card.upright || "");
        } else {
            meaning = card.text || "";
        }
        return `${userName} 抽取了 ${deckKind}：\n\n🎴 ${card.name}\n${orientation}${meaning}`;

    } catch (e) {
        console.error("[ERROR] handleDraw failed:", e);
        return `抽取时发生错误，请稍后再试。`;
    }
}