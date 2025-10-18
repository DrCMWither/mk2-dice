export function splitAttributes(str) {
    return str
        .replace(/([\p{Script=Han}A-Za-z]+)(\d+)/gu, "$1 $2")
        .replace(/(\d+)([\p{Script=Han}A-Za-z]+)/gu, "$1 $2")
        .trim();
}

export async function normalizeKey(env, key) {
    if (!key) return key;
    const synonyms = (await env.KV.get("synonyms", "json")) || {};
    return synonyms[key] || key;
}

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

export async function getInsanity(env, type, roll) {
    if (!type || !roll) return "未知症状";
    const insanityTables = (await env.KV.get("symptoms", "json")) || {};
    const table = insanityTables[type] || {};
    return table[roll] || "未知症状";
}

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

export function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }