export const TILE = {
    EAST: 0,
    SOUTH: 1,
    WEST: 2,
    NORTH: 3,
    RED: 4,
    GREEN: 5,
    WHITE: 6,

    MAN_1: 7,
    SOU_1: 16,
    PIN_1: 25,
};

export const HONOR_NAMES = ["东", "南", "西", "北", "中", "发", "白"];

export function isHonor(tile) {
    return Number.isInteger(tile) && tile >= 0 && tile <= 6;
}

export function tileSuit(tile) {
    if (tile >= 0  && tile <= 6 ) return "z";
    if (tile >= 7  && tile <= 15) return "m";
    if (tile >= 16 && tile <= 24) return "s";
    if (tile >= 25 && tile <= 33) return "p";
    return null;
}

export function tileNumber(tile) {
    if (tile >= 0  && tile <= 6 ) return tile + 1;
    if (tile >= 7  && tile <= 15) return tile - 6;
    if (tile >= 16 && tile <= 24) return tile - 15;
    if (tile >= 25 && tile <= 33) return tile - 24;
    return null;
}

export function isTerminal(tile) {
    const suit = tileSuit(tile);
    if (!suit || suit === "z") return false;

    const n = tileNumber(tile);
    return n === 1 || n === 9;
}

export function isYaochu(tile) {
    return isHonor(tile) || isTerminal(tile);
}

export function isWind(tile) {
    return tile >= 0 && tile <= 3;
}

export function isDragon(tile) {
    return tile >= 4 && tile <= 6;
}