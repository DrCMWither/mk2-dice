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
