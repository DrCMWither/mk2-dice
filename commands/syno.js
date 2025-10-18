import { getSynonyms } from "../utils/utils.js";

export async function handleSynonyms(env, message) {
    const parts = message.trim().split(/\s+/);
    if (parts.length < 2) return "用法: /syno <词>";

    const word = parts[1];
    const list = await getSynonyms(env, word);

    if (list.length === 0) return `未找到词「${word}」的同义词。`;
    return `词「${word}」的同义词: ${list.join("、")}`;
}
