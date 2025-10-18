import { generateProblem, bestDiscard } from "../utils/mahjong/nnkrHandler.js";
import { handToUnicode, mspzToTile, tileToUnicode, sortHand } from "../utils/mahjong/helper.js";
import { setAttribute, getAttributes, deleteAttribute } from "../utils/storage.js";
import { generateAdvancedProblem } from "../utils/mahjong/nnkrAdvance.js";
const botId = "xxxxxxxxx";
const WIND_NAMES = ["东", "南", "西", "北"];

export async function handleNnkr(env, message, chatId) {
    const parts = message.trim().split(/\s+/);
    const arg = parts[1];

    if (!arg || arg === "adv") {
        const isAdv = arg === "adv";
        const mode = isAdv ? "advanced" : "normal";

        const problem = isAdv
            ? generateAdvancedProblem(2, 4)
            : generateProblem(1, 3);

        const solution = bestDiscard(problem.hand);
        const bestDiscards = Array.from(new Set(solution.candidates.map(c => c.discard)));
        const sortedHand = sortHand(problem.hand);

        const problemData = {
            best: bestDiscards,
            expireAt: Date.now() + 5 * 60 * 1000
        };

        await setAttribute(env, botId, chatId, "nnkr_problem", problemData);

        if (!isAdv) {
            return `何切题（普通模式）：\n${handToUnicode(sortedHand)}\n\n请回复打一张牌。`;
        }

        const {
            roundWind,
            seatWind,
            turn,
            doraIndicators,
            doraTiles
        } = problem;

        const doraIndStr = doraIndicators.map(tileToUnicode).join("");

        const totalDora = 5;
        const extraDoraCount = totalDora - doraTiles.length;
        const extraDoraStr = "🀫".repeat(extraDoraCount > 0 ? extraDoraCount : 0);

        const doraDisplay = `${doraIndStr}${extraDoraStr}`.trim();
        const doraStr = doraTiles.map(tileToUnicode).join(" ");

        return (
`何切题（进阶模式）：
场风：${WIND_NAMES[roundWind]}\n自风：${WIND_NAMES[seatWind]}\n巡目：${turn}
宝牌指示：${doraDisplay}

${handToUnicode(sortedHand)}

请回复打一张牌`
        );
    }

    if (parts.length === 2) {
        const data = await getAttributes(env, botId, chatId);
        const problem = data.nnkr_problem;
        if (!problem) return "题目不存在，请先生成";

        if (Date.now() > problem.expireAt) {
            await deleteAttribute(env, botId, chatId, "nnkr_problem");
            return "题目已过期或不存在";
        }

        const ansTile = mspzToTile(parts[1]);
        if (ansTile === null) return "输入格式错误，请使用 mspz 记法（例如 3s）";

        if (problem.best.includes(ansTile)) {
            await deleteAttribute(env, botId, chatId, "nnkr_problem");
            return `正确！你选择的 ${tileToUnicode(ansTile)} 是最佳舍牌`;
        } else {
            const bestStr = problem.best.map(tileToUnicode).join(" ");
            await deleteAttribute(env, botId, chatId, "nnkr_problem");
            return `不正确。最佳舍牌是：${bestStr}`;
        }
    }

    return "题目已过期或不存在。";
}