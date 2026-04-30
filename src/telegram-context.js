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