import { getAttributes, setAttribute } from "../utils/storage.js";
import { rollDice } from "../utils/dice.js";
import { normalizeKey } from "../utils/utils.js";

function parseDiceExpr(expr) {
    expr = expr.trim();
    if (/^\d+$/.test(expr)) return parseInt(expr, 10);
    const m = expr.match(/^(\d+)d(\d+)$/i);
    if (m) {
        const n     = parseInt(m[1], 10);
        const sides = parseInt(m[2], 10);
        const rolls = rollDice(n, sides);
        return rolls.reduce((a, b) => a + b, 0);
    }
    return 0;
}

export async function handleSc(env, message, userId, chatId, userName) {
    const parts = message.trim().split(/\s+/);
    if (parts.length < 2) {
        return "用法: /sc <表达式1|表达式2>";
    }

    const storedName = await getAttributes(env, userId, chatId, true);
    if (storedName) {
        userName = storedName;
    }

    const exprParts = parts[1].split("/");
    if (exprParts.length !== 2) return "表达式格式错误，应为 <表达式1>/<表达式2>";

    const expr1 = exprParts[0];
    const expr2 = exprParts[1];

    const attrs     = await getAttributes(env, userId, chatId);
    const willKey   = await normalizeKey(env, "意志");
    const sanityKey = await normalizeKey(env, "理智");

    if (!(willKey in attrs) || !(sanityKey in attrs)) {
        return `未找到所需属性「意志」或「理智」。`;
    }

    const willValue = attrs[willKey];

    // POW Check
    const roll = 1 + Math.floor(Math.random() * 100);
    let result = "";
    if (roll === 1) result = "大成功";
    else if (roll >= 99) result = "大失败";
    else if (roll <= Math.floor(willValue / 5)) result = "极难成功";
    else if (roll <= Math.floor(willValue / 2)) result = "困难成功";
    else if (roll <= willValue) result = "成功";
    else result = "失败";

    const reduceExpr = ["大成功", "极难成功", "困难成功", "成功"].includes(result)
        ? expr1
        : expr2;

    const reduceValue = parseDiceExpr(reduceExpr);

    const newSanity = Math.max(0, attrs[sanityKey] - reduceValue);
    await setAttribute(env, userId, chatId, sanityKey, newSanity);

    return `🎲 ${userName} 进行「${willKey}」检定\n结果: ${roll}/${willValue} → ${result}\n${sanityKey}减少：${reduceValue}\n${attrs[sanityKey]} → ${newSanity}`;
}
