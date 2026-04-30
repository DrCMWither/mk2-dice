import {
    someDiceExpression,
    parseDiceExpression,
    formatDiceExpression,
    rollParsedDice,
                               } from "../utils/dice.js";
import { getAttributes         } from "../utils/storage.js";
import { escapeHtml, splitArgs } from "../utils/utils.js";

const DEFAULT_INITIATIVE_EXPR = "1d20";
const MAX_PARTICIPANTS = 32;
const MAX_DICE_PER_PARTICIPANT = 32;
const MAX_SIDES = 65535;

// use cleaner representation, general functions will soon be moved to utils/utils.js

function formatSignedModifier(value, spaced = true) {
    if (!value) return "";

    const abs = Math.abs(value);
    const sign = value > 0 ? "+" : "-";

    return spaced ? ` ${sign} ${abs}` : `${sign}${abs}`;
}


export async function handleRi(env, message, userId, chatId, userName) {
    const parts = splitArgs(message);

    if (/^\/ri(?:@[A-Za-z0-9_]+)?$/i.test(parts[0])) {
        parts.shift();
    }

    let diceExpr = DEFAULT_INITIATIVE_EXPR;

    if (parts.length > 0 && someDiceExpression(parts[0])) {
        diceExpr = parts.shift();
    }

    const parsed = parseDiceExpression(diceExpr);

    if (!parsed) {
        return "无法解析先攻骰式。用法：/ri [骰式] <名字>[±修正] ...";
    }

    if (parsed.repeat && parsed.repeat !== 1) {
        return "先攻骰暂不支持 C# 重复投掷写法，请使用单次骰式，例如 /ri d20 Alice Bob。";
    }

    if (parsed.count > MAX_DICE_PER_PARTICIPANT) {
        return `单个参战者的骰子数量过多，最多 ${MAX_DICE_PER_PARTICIPANT} 个。`;
    }

    if (parsed.sides > MAX_SIDES) {
        return `骰子面数过多，最多 ${MAX_SIDES} 面。`;
    }

    let participants;

    if (parts.length === 0) {
        const storedName = await getAttributes(env, userId, chatId, true);

        participants = [
            {
                name: storedName || userName || "匿名",
                modifier: 0,
            },
        ];
    } else {
        if (parts.length > MAX_PARTICIPANTS) {
            return `参战者过多，最多 ${MAX_PARTICIPANTS} 名。`;
        }

        participants = parts.map(parseNameWithModifier);

        if (participants.some((x) => !x)) {
            return "参战者格式错误。示例：/ri d20 Alice+3 Bob-1 Charlie";
        }
    }

    const results = participants.map((participant, index) => {
        const roll = rollParsedDice(parsed);
        const total = roll.total + participant.modifier;

        return {
            index,
            name: participant.name,
            modifier: participant.modifier,
            total,
            expanded:
                roll.expanded +
                formatSignedModifier(participant.modifier, true),
        };
    });

    results.sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        return a.index - b.index;
    });

    const totalCounts = new Map();

    for (const item of results) {
        totalCounts.set(item.total, (totalCounts.get(item.total) || 0) + 1);
    }

    const notation = formatDiceExpression(parsed);
    let output = `🎲 先攻排序：${escapeHtml(notation)}\n`;

    results.forEach((item, index) => {
        const tied = totalCounts.get(item.total) > 1 ? "（同值）" : "";

        output += `${index + 1}. ${escapeHtml(item.name)}：${escapeHtml(item.expanded)} = ${item.total}${tied}\n`;
    });

    return output.trim();
}