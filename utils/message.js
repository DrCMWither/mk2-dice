const BOT_TOKEN      = "xxxxxxxx";

export async function handleMessage(chatId, payload, options = {}) {
    const url = options.edit
        ? `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`
        : `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const body = {
        chat_id: chatId,
        ...payload
    };

    if (options.edit && options.messageId) {
        body.message_id = options.messageId;
    }

    return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
}
