import { rollDice } from "../utils/dice.js";
import { getAttributes } from "../utils/storage.js";

export async function handleRoll(env, message, userId, chatId, userName) {
    const parts = message.match(/^\/(roll|r|rh)(?:\s+(\d*)d(\d+)(?:\*(\d+))?([+-]\d+)?)?$/i);
    if (!parts) return "格式错误，请使用 /r NdM[*X][+Y]";

    const storedName = await getAttributes(env, userId, chatId, true);
    if (storedName) {
        userName = storedName;
    }

    let count      = parts[2] ? parseInt(parts[2], 10) : 1;
    let sides      = parts[3] ? parseInt(parts[3], 10) : 6;
    let multiplier = parts[4] ? parseInt(parts[4], 10) : 1;
    let modifier   = parts[5] ? parseInt(parts[5], 10) : 0;

    if (sides < 1) return "骰子的面数必须至少为 1!";

    if (count > 50) count = 50;
    if (count < 1 ) count = 1;

    const rolls = rollDice(count, sides);
    const sum   = rolls.reduce((a, b) => a + b, 0);
    const total = sum * multiplier + modifier;

    let diceNotation = `${count}d${sides}`;
    if (multiplier !== 1) diceNotation += `*${multiplier}`;
    if (modifier !== 0) diceNotation += (modifier > 0 ? "+" : "") + modifier;

    let expanded = rolls.join(" + ");
    if (multiplier !== 1) expanded = `(${expanded})*${multiplier}`;
    if (modifier !== 0) expanded += ` (${modifier > 0 ? "+" : ""}${modifier})`;

    return `🎲 ${userName} 的投掷结果: ${diceNotation} = ${expanded}\n合计: ${total}`;
}
