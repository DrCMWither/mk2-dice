/**
 * Splits a string containing letters and numbers into separate parts.
 *
 * Example: "abc123" → "abc 123", "123abc" → "123 abc"
 *
 * @param {string} str - The input string to split.
 * @returns {string} - The string with letters and numbers separated by a space.
 */
export function splitAttributes(str) {
    return str
        .replace(/([\p{Script=Han}A-Za-z]+)(\d+)/gu, "$1 $2")
        .replace(/(\d+)([\p{Script=Han}A-Za-z]+)/gu, "$1 $2")
        .trim();
}

/**
 * Normalizes a key using a synonyms table stored in KV.
 *
 * @param {Object} env - The environment/context object containing KV storage.
 * @param {string} key - The key to normalize.
 * @returns {Promise<string>} - The normalized key if a synonym exists, otherwise the original key.
 */
export async function normalizeKey(env, key) {
    if (!key) return key;
    const synonyms = (await env.KV.get("synonyms", "json")) || {};
    return synonyms[key] || key;
}

/**
 * Retrieves all synonyms for a given word from KV.
 *
 * @param {Object} env - The environment/context object containing KV storage.
 * @param {string} word - The word to find synonyms for.
 * @returns {Promise<string[]>} - An array of synonyms including the original word.
 */
export async function getSynonyms(env, word) {
    if (!word) return [];
    const synonyms = (await env.KV.get("synonyms", "json")) || {};
    // Find standard key
    const leadName = synonyms[word] || word;
    const result = [];
    for (const [k, v] of Object.entries(synonyms)) {
        if (v === leadName) result.push(k);
    }

    return result;
}

/**
 * Retrieves an insanity symptom description from KV based on type and roll.
 *
 * @param {Object} env - The environment/context object containing KV storage.
 * @param {string} type - The insanity table type (e.g., "Ti", "Li", "Phobia", "Manics").
 * @param {number|string} roll - The roll number to look up in the table.
 * @returns {Promise<string>} - The symptom description, or "未知症状" if not found.
 */
export async function getInsanity(env, type, roll) {
    if (!type || !roll) return "未知症状";
    const insanityTables = (await env.KV.get("symptoms", "json")) || {};
    const table = insanityTables[type] || {};
    return table[roll] || "未知症状";
}


/**
 * Escapes HTML special characters in a string to prevent injection issues.
 *
 * @param {string} str - The input string.
 * @returns {string} - The escaped string safe for HTML display.
 */
export function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/`/g, "&#96;");
}

/**
 * Shuffles an array in-place using the Fisher–Yates algorithm.
 *
 * @param {any[]} arr - The array to shuffle.
 * @returns {any[]} - The shuffled array (same reference as input).
 */
export function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }