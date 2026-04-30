/**
 * Transforms a raw Telegram Update into a unified context object.
 * * This helper normalizes data from different update types (standard messages,
 * edited messages, and callback queries) so that command handlers can access
 * user and chat information using a consistent interface.
 *
 * @param {Object} update - The raw JSON body received from the Telegram Webhook.
 * @param {Object} env - Environment bindings provided by the Cloudflare Worker.
 * @param {Object} executionCtx - Context object for the current Worker invocation.
 * @returns {TelegramContext} A flattened context object for easy consumption by handlers.
 */
export function createTelegramContext(update, env, executionCtx) {
    const messageObject = update.message || update.edited_message || null;
    const callback = update.callback_query || null;

    const chat = messageObject?.chat || callback?.message?.chat || {};
    const from = messageObject?.from || callback?.from || {};

    let userName = (
        from?.last_name ||
        from?.username ||
        from?.first_name ||
        "匿名"
    ).toString().trim();

    if (userName.length > 32) {
        userName = userName.slice(0, 32) + "...";
    }

    return {
        update,
        env,
        executionCtx,

        messageObject,
        callback,

        message: messageObject?.text || "",
        chatId: chat.id,
        userId: from.id,
        userName,
        chatTitle: chat.title || `群${chat.id}`,
    };
}