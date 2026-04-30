import { registry           } from "./command-registry.js";

import { handleHelp         } from "../commands/help.js";
import { handleRoll         } from "../commands/roll.js";
import { handleSt           } from "../commands/st.js";
import { handleRa           } from "../commands/ra.js";
import { handleRi           } from "../commands/ri.js";
import { handleGetst        } from "../commands/getst.js";
import { handleSynonyms     } from "../commands/syno.js";
import { handleSc           } from "../commands/sc.js";
import { handleLi, handleTi } from "../commands/insanity.js";
import { handleName         } from "../commands/nn.js";
import { handleNnkr         } from "../commands/nnkr.js";
import { jrrp               } from "../commands/jrrp.js";
import { handleDeck         } from "../commands/deck.js";
import { handleDraw         } from "../commands/draw.js";

/**
 * Command registrations link the CommandRegistry to individual handler functions.
 * Each registration defines:
 * - The primary command trigger (e.g., "roll").
 * - Optional aliases (e.g., "r").
 * - A handler function that receives the unified Telegram context.
 * - Optional routing logic (e.g., `targetChatId` for private rolls).
 */
registry
    .register("help", {
        aliases: ["start"],
        handler: () => handleHelp(0),
    })

    .register("roll", {
        aliases: ["r"],
        handler: (ctx) =>
            handleRoll(ctx.env, ctx.message, ctx.userId, ctx.chatId, ctx.userName, false),
    })

    .register("rq", {
        handler: (ctx) =>
            handleRoll(ctx.env, ctx.message, ctx.userId, ctx.chatId, ctx.userName, true),
    })

    .register("ri", {
        handler: (ctx) =>
          handleRi(ctx.env, ctx.message, ctx.userId, ctx.chatId, ctx.userName),
      })

    .register("rh", {
        targetChatId: (ctx) => ctx.userId,
        handler: (ctx) =>
            handleRoll(ctx.env, ctx.message, ctx.userId, ctx.chatId, ctx.userName, false),
    })

    .register("ra", {
        handler: (ctx) =>
            handleRa(ctx.env, ctx.message, ctx.userId, ctx.chatId, ctx.userName),
    })

    .register("st", {
        handler: (ctx) =>
            handleSt(ctx.env, ctx.message, ctx.userId, ctx.chatId, ctx.chatTitle),
    })

    .register("getst", {
        handler: (ctx) =>
            handleGetst(
                ctx.env,
                ctx.message,
                ctx.userId,
                ctx.chatId,
                ctx.chatTitle,
                ctx.userName,
            ),
    })

    .register("syno", {
        handler: (ctx) => handleSynonyms(ctx.env, ctx.message),
    })

    .register("sc", {
        handler: (ctx) =>
            handleSc(ctx.env, ctx.message, ctx.userId, ctx.chatId, ctx.userName),
    })

    .register("li", {
        handler: (ctx) => handleLi(ctx.env),
    })

    .register("ti", {
        handler: (ctx) => handleTi(ctx.env),
    })

    .register("nn", {
        handler: (ctx) =>
            handleName(
                ctx.env,
                ctx.message,
                ctx.userId,
                ctx.chatId,
                ctx.chatTitle,
                ctx.userName,
            ),
    })

    .register("nnkr", {
        handler: (ctx) => handleNnkr(ctx.env, ctx.message, ctx.chatId),
    })

    .register("jrrp", {
        handler: (ctx) => jrrp(ctx.env, ctx.userId, ctx.chatId, ctx.userName),
    })

    .register("deck", {
        handler: (ctx) =>
            handleDeck(ctx.env, ctx.message, ctx.userId, ctx.chatId, ctx.userName),
    })

    .register("draw", {
        handler: (ctx) =>
            handleDraw(ctx.env, ctx.message, ctx.userId, ctx.chatId, ctx.userName),
    });

registry.registerCallback("help-page", {
    match: /^help_(\d+)$/,
    handler: async (ctx, match) => {
        const page = Number(match[1]);

        if (!Number.isInteger(page) || page < 0) {
            console.warn("[WARN] Invalid help page:", match[1]);
            return null;
        }

        return {
            payload: handleHelp(page),
            targetChatId: ctx.callback.message.chat.id,
            options: {
                edit: true,
                messageId: ctx.callback.message.message_id,
            },
        };
    },
});