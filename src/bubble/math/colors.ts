
// The Color in sRGB space
// the RGB values are in the range [0, 1]
export type Color4f = [number, number, number, number];

function newColor4f(r: number, g: number, b: number, a: number): Color4f {
    return [r, g, b, a];
}

function newColor4fFromHex(hex: string | number): Color4f {
    if (typeof hex === "string") {
        let start = hex[0] === "#" ? 1 : 0;
        hex = parseInt(hex.slice(start), 16);
    }
    return [
        ((hex >> 16) & 0xff) / 255,
        ((hex >> 8) & 0xff) / 255,
        (hex & 0xff) / 255,
        1
    ];
}

function color4fToHex(color: Color4f): number {
    return (Math.round(color[0] * 255) << 16) + (Math.round(color[1] * 255) << 8) + Math.round(color[2] * 255);
}

function srgbToLinear(value: Color4f): Color4f {
    const srgbToLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return [srgbToLinear(value[0]), srgbToLinear(value[1]), srgbToLinear(value[2]), value[3]];
}

function fromLinear(value: Color4f): Color4f {
    const linearToSrgb = (c: number) => c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return [linearToSrgb(value[0]), linearToSrgb(value[1]), linearToSrgb(value[2]), value[3]];
}

export default {
    newColor4f,
    newColor4fFromHex,
    color4fToHex,
    srgbToLinear,
    fromLinear
}