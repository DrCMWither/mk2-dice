import { rollDice, parseDiceExpression } from "../utils/dice.js";
import { getAttributes } from "../utils/storage.js";
import { escapeHtml } from "../utils/utils.js";

const DEFAULT_INITIATIVE_EXPR = "1d20";
const MAX_PARTICIPANTS = 32;
const MAX_DICE_PER_PARTICIPANT = 32;
const MAX_SIDES = 65535;

function stripCommand(message) {
  return String(message || "")
    .replace(/^\/ri(?:@[A-Za-z0-9_]+)?(?:\s+)?/i, "")
    .trim();
}

function tokenizeArgs(args) {
  return String(args || "")
    .split(/[\s,，、]+/u)
    .map((x) => x.trim())
    .filter(Boolean);
}

function looksLikeDiceExpression(token) {
  if (!token) return false;
  if (!/d/i.test(token)) return false;
  return Boolean(parseDiceExpression(token));
}

function formatDiceNotation(parsed) {
  let notation = `${parsed.count}d${parsed.sides}`;

  if (parsed.multiplier !== 1) {
    notation += `*${parsed.multiplier}`;
  }

  if (parsed.modifier !== 0) {
    notation += parsed.modifier > 0 ? `+${parsed.modifier}` : `${parsed.modifier}`;
  }

  return notation;
}

function parseParticipantToken(token) {
  const match = String(token || "").match(/^(.+?)([+-]\d+)?$/u);
  if (!match) return null;

  const name = match[1]?.trim();
  const bonus = match[2] ? Number(match[2]) : 0;

  if (!name) return null;
  if (!Number.isInteger(bonus)) return null;

  return { name, bonus };
}

function formatBonus(bonus) {
  if (!bonus) return "";
  return bonus > 0 ? ` + ${bonus}` : ` - ${Math.abs(bonus)}`;
}

function rollOneInitiative(parsed, bonus) {
  const rolls = rollDice(parsed.count, parsed.sides);
  const sum = rolls.reduce((acc, x) => acc + x, 0);
  const diceTotal = sum * parsed.multiplier + parsed.modifier;
  const total = diceTotal + bonus;

  let expanded = rolls.join(" + ");

  if (parsed.multiplier !== 1) {
    expanded = `(${expanded})*${parsed.multiplier}`;
  }

  if (parsed.modifier !== 0) {
    expanded += parsed.modifier > 0 ? ` + ${parsed.modifier}` : ` - ${Math.abs(parsed.modifier)}`;
  }

  if (bonus !== 0) {
    expanded += formatBonus(bonus);
  }

  return {
    rolls,
    diceTotal,
    total,
    expanded,
  };
}

export async function handleRi(env, message, userId, chatId, userName) {
  const rawArgs = stripCommand(message);
  const tokens = tokenizeArgs(rawArgs);

  let diceExpr = DEFAULT_INITIATIVE_EXPR;

  if (tokens.length > 0 && looksLikeDiceExpression(tokens[0])) {
    diceExpr = tokens.shift();
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

  if (tokens.length === 0) {
    const storedName = await getAttributes(env, userId, chatId, true);
    participants = [
      {
        name: storedName || userName || "匿名",
        bonus: 0,
      },
    ];
  } else {
    if (tokens.length > MAX_PARTICIPANTS) {
      return `参战者过多，最多 ${MAX_PARTICIPANTS} 名。`;
    }

    participants = tokens.map(parseParticipantToken);

    if (participants.some((x) => !x)) {
      return "参战者格式错误。示例：/ri d20 Alice+3 Bob-1 Charlie";
    }
  }

  const notation = formatDiceNotation(parsed);

  const results = participants.map((participant, index) => {
    const roll = rollOneInitiative(parsed, participant.bonus);

    return {
      index,
      name: participant.name,
      bonus: participant.bonus,
      ...roll,
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

  let output = `🎲 先攻排序：${escapeHtml(notation)}\n`;

  results.forEach((item, index) => {
    const tied = totalCounts.get(item.total) > 1 ? "（同值）" : "";

    output += `${index + 1}. ${escapeHtml(item.name)}：${escapeHtml(item.expanded)} = ${item.total}${tied}\n`;
  });

  return output.trim();
}