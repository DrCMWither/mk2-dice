import { escapeHtml } from "../utils/utils.js";

const commands = [
    "/roll 或 /r [C#]NdM[*X][+Y] - 投掷骰子",
    "/ra <属性> [临时值] - 属性检定",
    "/rh [C#]NdM[*X][+Y] - 投掷暗骰",
    "/rq - 投掷量子骰",
    "/jrrp - 查看今日人品",
    "/nn <昵称> - 设置当前群昵称",
    "/nn clear - 清除当前群昵称",
    "/nn clearall - 清除所有群昵称",
    "/nnkr [adv] - 随机何切题",
    "/nnkr <牌> - 回答随机何切题（使用 mspz 记牌法）",
    "/sc <表达式1>/<表达式2> - 意志检定",
    "/li - 决定总结疯狂症状",
    "/ti - 决定临时疯狂症状",
    "/st <属性> <值> [...] - 设置属性",
    "/st del <属性> - 删除属性",
    "/st clear - 清除当前群所有属性",
    "/st clearall - 清除所有群属性",
    "/syno <属性> - 显示属性同义词",
    "/getst - 查看自己当前群属性",
    "/getst all - 查看自己在所有群属性",
    "/help - 显示帮助信息"
];
const PAGE_SIZE = 5;

function getPageText(page = 0) {
    const start = page  * PAGE_SIZE;
    const end   = start + PAGE_SIZE;
    const pageCommands = commands.slice(start, end)
        .map(c => `<pre>${escapeHtml(c)}</pre>`).join("\n");
    return `<b>欢迎使用试作型神器森罗万象虫洞吞噬者 MK.II 自动随机数系统</b>\n\n${pageCommands}`;
}

function getKeyboard(page = 0) {
    const totalPages = Math.ceil(commands.length / PAGE_SIZE);
    const buttons = [];
    if (page > 0) buttons.push({ text: "上一页", callback_data: `help_${page-1}` });
    if (page < totalPages - 1) buttons.push({ text: "下一页", callback_data: `help_${page+1}` });
    return { inline_keyboard: [buttons] };
}

export function handleHelp(page = 0) {
    return {
        text: getPageText(page),
        parse_mode: "HTML",
        reply_markup: getKeyboard(page)
    };
}