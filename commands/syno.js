import { getSynonyms } from "../utils/utils.js";

/**
 * Handles the /syno command to retrieve synonyms for a given word.
 *
 * @param {Object} env - The environment/context object, which may provide access to utilities or databases.
 * @param {string} message - The command message, e.g., "/syno happy".
 * @returns {Promise<string>} - A message listing the synonyms of the word, or a notice if none are found.
 *
 * @example
 * await handleSynonyms(env, "/syno POW");
 * // returns: "词「happy」的同义词: 意志、[]...]"
 *
 * @example
 * await handleSynonyms(env, "/syno test");
 * // returns: "未找到词「test」的同义词。"
 */
export async function handleSynonyms(env, message) {
    const parts = message.trim().split(/\s+/);
    if (parts.length < 2) return "用法: /syno <词>";

    const word = parts[1];
    const list = await getSynonyms(env, word);

    if (list.length === 0) return `未找到词「${word}」的同义词。`;
    return `词「${word}」的同义词: ${list.join("、")}`;
}
