/**
 * Sends or edits a message via the Telegram Bot API.
 *
 * Depending on the `options.edit` flag, the function either:
 * 1. Sends a new message to the specified chat.
 * 2. Edits an existing message in the specified chat.
 *
 * @param {number|string} chatId - The unique identifier for the target chat.
 * @param {Object} payload - The payload object containing message parameters (e.g., text, parse_mode, reply_markup).
 * @param {Object} [options] - Optional settings.
 * @param {boolean} [options.edit=false] - If true, edit an existing message instead of sending a new one.
 * @param {number} [options.messageId] - The ID of the message to edit (required if `edit` is true).
 * @returns {Promise<Response>} - A Promise resolving to the fetch Response object from the Telegram API.
 *
 * @example
 * // Send a new message
 * await handleMessage(123456789, { text: "Hello, world!" });
 *
 * @example
 * // Edit an existing message
 * await handleMessage(123456789, { text: "Updated text" }, { edit: true, messageId: 42 });
 */
export async function handleMessage(chatId, payload, options = {}) {
    const url = options.edit
        ? `https://api.telegram.org/bot${env.BOT_TOKEN}/editMessageText`
        : `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;

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
