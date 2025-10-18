import { getAttributes } from "../utils/storage.js";
import { normalizeKey  } from "../utils/utils.js";
import { rollDice      } from "../utils/dice.js";
import { escapeHtml } from "../utils/utils.js";

export async function handleRa(env, message, userId, chatId, userName) {
    const parts = message.trim().split(/\s+/);
    if (parts.length < 2) {
        return "用法: /ra <属性> [临时值]";
    }

    const storedName = await getAttributes(env, userId, chatId, true);
    if (storedName) {
        userName = storedName;
    }

    const rawAttrName  = parts[1];
    const tempValue    = parts[2] ? parseInt(parts[2], 10) : null;
    const attrName     = await normalizeKey(env, rawAttrName);

    // Load from KV
    const attrs = await getAttributes(env, userId, chatId);
    const value = attrs[attrName] ?? tempValue;

    if (!value || isNaN(value)) {
        return `未找到属性「${escapeHtml(rawAttrName)}」，也未提供临时值。`;
    }

    // 1d100
    const rollArr = rollDice(1, 100);
    const roll    = rollArr[0];

    let result = "";
    if (roll === 1) {
        result = "大成功";
    } else if (roll >= 99) {
        result = "大失败";
    } else if (roll <= Math.floor(value / 5)) {
        result = "极难成功";
    } else if (roll <= Math.floor(value / 2)) {
        result = "困难成功";
    } else if (roll <= value) {
        result = "成功";
    } else {
        result = "失败";
    }

    const displayName = rawAttrName !== attrName
        ? `${rawAttrName}（→${attrName}）`
        : rawAttrName;

    return `🎲 ${escapeHtml(userName)} 进行「${escapeHtml(displayName)}」检定\n结果: ${roll}/${value} → ${result}`;
}
