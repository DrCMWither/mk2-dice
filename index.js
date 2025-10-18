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
            li:    async () => handleLi       (env                                              ),
            nn:    async () => handleName     (env, message, userId, chatId, chatTitle, userName),
            roll:  async () => handleRoll     (env, message, userId, chatId,            userName),
            r:     async () => handleRoll     (env, message, userId, chatId,            userName),
            ra:    async () => handleRa       (env, message, userId, chatId,            userName),
            rh:    async () => handleRoll     (env, message, userId, null,              userName),
            st:    async () => handleSt       (env, message, userId, chatId, chatTitle          ),
            getst: async () => handleGetst    (env, message, userId, chatId, chatTitle, userName),
            syno:  async () => handleSynonyms (env, message                                     ),
            sc:    async () => handleSc       (env, message, userId, chatId,            userName),
            ti:    async () => handleTi       (env                                              ),
            nnkr:  async () => handleNnkr     (env, message, chatId                             ),
            fsck:  async () => handleFastcheck(                                                 ),
        };

        const helpMatch = message.match(/^\/help(?:@cmwasp_dice_bot)?$/);
        if (helpMatch) {
            console.log(`[LOG] Matched /help for chat ${chatId}. Sending help message.`);
            await handleMessage(chatId, handleHelp(0));
        } else {
            const cmdMatch = message.slice(0, 1024).match(/^\/(\w+)(?:@cmwasp_dice_bot)?(?:\s+(.+))?$/);
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
