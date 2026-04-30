import { registry              } from "./command-registry.js";
import                                "./cmd.js";

import { createTelegramContext } from "./telegram-context.js";
import { handleMessage         } from "./utils/message.js";

function validateEnv(env) {
    const missing = [];

    if (!env.BOT_TOKEN) missing.push("BOT_TOKEN"             );
    if (!env.BOT_NAME ) missing.push("BOT_NAME"              );
    if (!env.KV       ) missing.push("KV (Namespace Binding)");

    return missing;
}

function normalizeDispatchResult(result) {
    if (!result) return null;

    if (typeof result === "string") {
        return {
            payload: {
                text: result,
                parse_mode: "HTML",
            },
        };
    }

    if ("text" in result || "reply_markup" in result || "parse_mode" in result) {
        return {
            payload: result,
        };
    }

    return result;
}

async function sendDispatchResult(ctx, result, fallbackTargetChatId) {
    const normalized = normalizeDispatchResult(result);
    if (!normalized) return;

    const targetChatId =
        normalized.targetChatId ??
        fallbackTargetChatId ??
        ctx.chatId;

    const payload = normalized.payload;
    const options = normalized.options || {};

    if (!targetChatId || !payload) return;

    await handleMessage(targetChatId, payload, options);
}

async function dispatchMessage(ctx) {
    const parsed = registry.parseCommand(ctx.message, ctx.env.BOT_NAME);
    if (!parsed) return;

    const { name, command } = parsed;

    try {
        const result = await command.handler(ctx, parsed);

        const targetChatId =
            typeof command.targetChatId === "function"
                ? command.targetChatId(ctx, parsed)
                : command.targetChatId;

        await sendDispatchResult(ctx, result, targetChatId);
    } catch (err) {
        console.error(`[ERROR] Command ${name} failed:`, err);

        await handleMessage(ctx.env, ctx.chatId, {
            text: `命令执行失败，请稍后再试。原因：${err}`,
        });
    }
}

async function dispatchCallback(ctx) {
    const data = ctx.callback?.data;
    if (!data) return;

    const matched = registry.matchCallback(data);
    if (!matched) return;

    const { callback, match } = matched;

    try {
        const result = await callback.handler(ctx, match);
        await sendDispatchResult(ctx, result, ctx.callback.message.chat.id);
    } catch (err) {
        console.error(`[ERROR] Callback ${callback.name} failed:`, err);
    }
}

export default {
    async fetch(request, env, executionCtx) {
        const missingConfigs = validateEnv(env);

        if (missingConfigs.length > 0) {
            console.error(
                `[FATAL ERROR] Service <${env.SERVICE_NAME || "Unknown"}> is missing required configurations: ${missingConfigs.join(", ")}`,
            );

            return new Response("Internal Server Error: Bot configuration is incomplete.", {
                status: 500,
            });
        }

        let update;

        try {
            update = await request.json();
        } catch (err) {
            console.error("[ERROR] Failed to parse JSON:", err);
            return new Response("Invalid JSON", { status: 400 });
        }

        const ctx = createTelegramContext(update, env, executionCtx);

        if (ctx.callback) {
            await dispatchCallback(ctx);
            return new Response("OK");
        }

        if (ctx.message) {
            await dispatchMessage(ctx);
        }

        return new Response("OK");
    },
};