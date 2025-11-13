import { handleHelp      } from "./commands/help.js";
import { handleRoll      } from "./commands/roll.js";
import { handleSt        } from "./commands/st.js";
import { handleRa        } from "./commands/ra.js";
import { handleGetst     } from "./commands/getst.js";
import { handleSynonyms  } from "./commands/syno.js";
import { handleSc        } from "./commands/sc.js";
import { handleLi,
         handleTi        } from "./commands/insanity.js";
import { handleName      } from "./commands/nn.js";
import { handleMessage   } from "./utils/message.js";
import { errorI18n       } from "./utils/etrans.js";
import { handleNnkr      } from "./commands/nnkr.js";
import { handleFastcheck } from "./commands/fsck.js";
import { jrrp            } from "./commands/jrrp.js";


/**
 * Cloudflare Worker entry point for handling Telegram bot updates.
 *
 * This default export object provides a `fetch` handler that:
 * 1. Parses incoming Telegram webhook requests.
 * 2. Extracts the message text, chat ID, user ID, username, and chat title.
 * 3. Matches the message against known bot commands (e.g., /roll, /st, /nn, /li, /ti, /ra, /getst, /syno, /sc, /nnkr, /fsck).
 * 4. Executes the corresponding command handler and sends the reply via `handleMessage`.
 * 5. Handles `/help` commands and paginated help callback queries.
 * 6. Handles errors gracefully and logs relevant messages.
 *
 * @default
 * @property {Function} fetch - The main request handler for the Worker.
 *
 * @param {Request} request - The incoming HTTP request (Telegram webhook POST).
 * @param {Object} env - Environment object containing KV namespaces and other bindings.
 * @param {Object} ctx - Context object provided by Cloudflare Worker runtime.
 *
 * @returns {Promise<Response>} - Always returns a Response with body "OK" or an error status.
 *
 * @example
 * // Deploy as a Cloudflare Worker with the route /telegram-webhook
 * export default { fetch };
 *
 * // Telegram sends a POST request with update JSON
 * // The Worker parses and dispatches to the appropriate command handler
 */
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        let update;
        try {
            update = await request.json();
        } catch (err) {
            console.error("[ERROR] Failed to parse JSON:", err);
            return new Response("Invalid JSON", { status: 400 });
        }

        const message  = update.message?.text || "";
        const chatId   = update.message?.chat.id;
        const userId   = update.message?.from.id;

        const from      = update.message?.from || {};
        let   userName  = (from?.last_name || from?.username || from?.first_name || "匿名").toString().trim();
        const chatTitle = update.message?.chat?.title || `群${chatId}`;
        if (userName.length > 32) userName = userName.slice(0, 32) + "...";

        let reply = null;

        const commands = {
            deck:  async () => handleDeck     (env, message, userId, chatId,            userName),
            draw:  async () => handleDraw     (env, message, userId, chatId,            userName),
            jrrp:  async () => jrrp           (env,          userId, chatId,            userName),
            li:    async () => handleLi       (env                                              ),
            nn:    async () => handleName     (env, message, userId, chatId, chatTitle, userName),
            roll:  async () => handleRoll     (env, message, userId, chatId, false,     userName),
            r:     async () => handleRoll     (env, message, userId, chatId, false,     userName),
            rq:    async () => handleRoll     (env, message, userId, chatId, true,      userName),
            ra:    async () => handleRa       (env, message, userId, chatId,            userName),
            rh:    async () => handleRoll     (env, message, userId, null,   false,     userName),
            st:    async () => handleSt       (env, message, userId, chatId, chatTitle          ),
            getst: async () => handleGetst    (env, message, userId, chatId, chatTitle, userName),
            syno:  async () => handleSynonyms (env, message                                     ),
            sc:    async () => handleSc       (env, message, userId, chatId,            userName),
            ti:    async () => handleTi       (env                                              ),
            nnkr:  async () => handleNnkr     (env, message, chatId                             ),
            fsck:  async () => handleFastcheck(                                                 ),
        };

        const helpMatch = message.match(/^\/help(?:@${env.BOT_NAME})?$/);
        if (helpMatch) {
            console.log(`[LOG] Matched /help for chat ${chatId}. Sending help message.`);
            await handleMessage(chatId, handleHelp(0));
        } else {
            const cmdMatch = message.slice(0, 1024).match(/^\/(\w+)(?:@${env.BOT_NAME})?(?:\s+(.+))?$/);
            if (cmdMatch) {
                const cmd = cmdMatch[1];
                if (commands[cmd]) {
                    try {
                        reply = await commands[cmd]();
                        const targetChatId = cmd === "rh" ? userId : chatId;
                        if (reply) {
                            await handleMessage(targetChatId, { text: reply, parse_mode: "HTML" });
                        }
                    } catch (err) {
                        console.error(`[ERROR] Command ${cmd} failed:`, err);
                        await handleMessage(chatId, { text: `命令执行失败，请稍后再试。原因：${err}` });
                    }
                }
            }
        }

        const callback = update.callback_query;
        if (callback?.data?.startsWith("help_")) {
            const pageStr = callback.data.split("_")[1];
            const page = Number(pageStr);
            if (!Number.isInteger(page) || page < 0) {
                console.warn("[WARN] Invalid help page:", pageStr);
                return new Response("OK");
            }
            await handleMessage(
                callback.message.chat.id,
                handleHelp(page),
                { edit: true, messageId: callback.message.message_id }
            );
        }

        return new Response("OK");
    },
};