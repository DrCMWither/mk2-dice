import { rollDice } from "../utils/dice.js";
import { getAttributes } from "../utils/storage.js";
import { escapeHtml } from "../utils/utils.js";

export async function jrrp(env, userId, chatId, userName) {
    const storedName = await getAttributes(env, userId, chatId, true);
    if (storedName) userName = storedName;
    const rolls = rollDice(1, 100);
    return `${escapeHtml(userName)} 的今日人品： \n${rolls[0]}`;

}