// Abandoned
export function errorI18n(err) {
    if (err.message.includes("429 Too Many Requests")) return "429，字符串过长或者操作过快"
}