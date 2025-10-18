# mk2-dice
Dice bot for telegram-Cloudflare Worker.

A free instance is available at telegram@cmwasp_dice_bot.

## How to deploy
1. Clone the entire project to your Cloudflare Worker;

2. Register your Bot ID/token/secret in the corresponding file, or set enviroment variables;

3. Create a new KB table and sent both [synonyms.json](sympotms.json) and [synonyms](./synonyms.json) to this KV table;

4. Upon completion, bind the Telegram API and use the /help command for fsck.