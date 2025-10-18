import { getInsanity } from "../utils/utils.js";
import { rollDice } from "../utils/dice.js";

export async function handleInsanity(env, tableKey, label) {
    try {
        let rolls = rollDice(2, 10); // [main, duration]
        if (!Array.isArray(rolls) || rolls.length < 2) {
            console.warn("[WARN] rollDice 返回异常，使用默认值 [1,1]");
            rolls = [1, 1];
        }

        let main = Number(rolls[0]);
        let duration = Number(rolls[1]);

        if (!Number.isInteger(main) || main < 1 || main > 10) main = 1;
        if (!Number.isInteger(duration) || duration < 1 || duration > 10) duration = 1;

        const typeText = await getInsanity(env, tableKey, main);

        if (main === 9) {
            const pRoll = rollDice(1, 100);
            const p = Number(pRoll[0]) || 1;
            const sub = await getInsanity(env, "Phobia", p);
            return `${label}：\n${typeText}\n具体恐惧症状为：${sub}\n持续时间：1d10 = ${duration} 轮。`;
        } else if (main === 10) {
            const mRoll = rollDice(1, 100);
            const m = Number(mRoll[0]) || 1;
            const sub = await getInsanity(env, "Manics", m);
            return `${label}：\n${typeText}\n具体躁狂症状为：${sub}\n持续时间：1d10 = ${duration} 轮。`;
        } else {
            return `${label}：\n${typeText}\n持续时间：1d10 = ${duration} 轮。`;
        }
    } catch (err) {
        console.error("[ERROR] handleInsanity failed:", err);
        return `${label}：获取疯狂症状时发生错误，请稍后再试。`;
    }
}

export async function handleTi(env) {
    return handleInsanity(env, "Ti", "抽中的临时疯狂症状为");
}

export async function handleLi(env) {
    return handleInsanity(env, "Li", "抽中的总结疯狂症状为");
}
