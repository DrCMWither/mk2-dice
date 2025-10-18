export function rollDice(n, m) {
    const rolls = [];
    for (let i = 0; i < n; i++) {
        rolls.push(Math.floor(Math.random() * m) + 1);
    }
    return rolls;
}
