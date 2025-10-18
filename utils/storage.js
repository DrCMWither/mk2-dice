/**
 * Sets a user attribute or nickname in a specific chat group.
 *
 * @param {Object} env - The environment/context object containing KV storage.
 * @param {string} userId - The unique identifier of the user.
 * @param {string} chatId - The unique identifier of the chat group.
 * @param {string|null} key - The attribute key to set. Ignored if `isName` is true.
 * @param {any} value - The value to set for the attribute or nickname.
 * @param {boolean} [isName=false] - If true, sets the user's nickname instead of a general attribute.
 * @returns {Promise<void>}
 */
export async function setAttribute(env, userId, chatId, key, value, isName = false) {
    const groupKey = `group:${chatId}`;
    const groupData = (await env.KV.get(groupKey, "json")) || {};
    const userData = groupData[userId] || {};

    if (isName) {
        userData["name"] = value; // override @string
    } else {
        userData[key] = value;
    }

    groupData[userId] = userData;
    await env.KV.put(groupKey, JSON.stringify(groupData));
}

/**
 * Deletes a specific user attribute or nickname in a chat group.
 *
 * @param {Object} env - The environment/context object containing KV storage.
 * @param {string} userId - The unique identifier of the user.
 * @param {string} chatId - The unique identifier of the chat group.
 * @param {string} key - The attribute key to delete. Ignored if `isName` is true.
 * @param {boolean} [isName=false] - If true, deletes the user's nickname instead of a general attribute.
 * @returns {Promise<boolean>} - True if the deletion was successful, false otherwise.
 */
export async function deleteAttribute(env, userId, chatId, key, isName = false) {
    const groupKey = `group:${chatId}`;
    const groupData = (await env.KV.get(groupKey, "json")) || {};
    const userData = groupData[userId];
    if (!userData) return false;

    if (isName) {
        if (!("name" in userData)) return false;
        delete userData["name"];
    } else {
        if (!(key in userData)) return false;
        delete userData[key];
    }

    groupData[userId] = userData;
    await env.KV.put(groupKey, JSON.stringify(groupData));
    return true;
}


/**
 * Clears all attributes or the nickname for a user in a specific chat group.
 *
 * @param {Object} env - The environment/context object containing KV storage.
 * @param {string} userId - The unique identifier of the user.
 * @param {string} chatId - The unique identifier of the chat group.
 * @param {boolean} [isName=false] - If true, clears only the user's nickname.
 * @returns {Promise<boolean>} - True if something was cleared, false if nothing to clear.
 */
export async function clearAttributes(env, userId, chatId, isName = false) {
    const groupKey = `group:${chatId}`;
    const groupData = (await env.KV.get(groupKey, "json")) || {};
    if (!groupData[userId]) return false;

    if (isName) {
        if (!("name" in groupData[userId])) return false;
        delete groupData[userId]["name"];
    } else {
        delete groupData[userId];
    }

    await env.KV.put(groupKey, JSON.stringify(groupData));
    return true;
}

/**
 * Clears all attributes or nicknames for a user across all chat groups.
 *
 * @param {Object} env - The environment/context object containing KV storage.
 * @param {string} userId - The unique identifier of the user.
 * @param {boolean} [isName=false] - If true, clears only the user's nickname.
 * @returns {Promise<number>} - The number of groups where attributes/nickname were cleared.
 */
export async function clearAllAttributes(env, userId, isName = false) {
    const list = await env.KV.list({ prefix: "group:" });
    let cleared = 0;
    for (const item of list.keys) {
        const groupData = (await env.KV.get(item.name, "json")) || {};
        if (!groupData[userId]) continue;

        if (isName) {
            if ("name" in groupData[userId]) {
                delete groupData[userId]["name"];
                await env.KV.put(item.name, JSON.stringify(groupData));
                cleared++;
            }
        } else {
            delete groupData[userId];
            await env.KV.put(item.name, JSON.stringify(groupData));
            cleared++;
        }
    }
    return cleared;
}


/**
 * Retrieves all attributes or the nickname for a user in a specific chat group.
 *
 * @param {Object} env - The environment/context object containing KV storage.
 * @param {string} userId - The unique identifier of the user.
 * @param {string} chatId - The unique identifier of the chat group.
 * @param {boolean} [isName=false] - If true, returns only the nickname.
 * @returns {Promise<Object|string|null>} - Returns the attributes object, the nickname string, or null if not found.
 */
export async function getAttributes(env, userId, chatId, isName = false) {
    const groupKey = `group:${chatId}`;
    const groupData = (await env.KV.get(groupKey, "json")) || {};
    if (!groupData[userId]) return isName ? null : {};

    if (isName) {
        return groupData[userId]["name"] || null;
    } else {
        const { name, ...rest } = groupData[userId];
        return rest;
    }
}

/**
 * Retrieves all attributes or nicknames for a user across all chat groups.
 *
 * @param {Object} env - The environment/context object containing KV storage.
 * @param {string} userId - The unique identifier of the user.
 * @param {boolean} [isName=false] - If true, returns only nicknames.
 * @returns {Promise<Object>} - An object mapping chat IDs to attributes or nicknames.
 */
export async function getAllAttributes(env, userId, isName = false) {
    const list = await env.KV.list({ prefix: "group:" });
    const result = {};
    for (const item of list.keys) {
        const groupData = (await env.KV.get(item.name, "json")) || {};
        if (!groupData[userId]) continue;

        const chatId = item.name.replace("group:", "");
        if (isName) {
            if ("name" in groupData[userId]) {
                result[chatId] = groupData[userId]["name"];
            }
        } else {
            const { name, ...rest } = groupData[userId];
            if (Object.keys(rest).length > 0) {
                result[chatId] = rest;
            }
        }
    }
    return result;
}
