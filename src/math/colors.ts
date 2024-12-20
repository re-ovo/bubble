// The Color in sRGB space
// the RGB values are in the range [0, 1]
export type Color4f = Float32Array;
export type Color3f = Float32Array;

function newColor4f(r: number, g: number, b: number, a: number): Color4f {
  if (
    r === undefined ||
    g === undefined ||
    b === undefined ||
    a === undefined
  ) {
    throw new Error('Invalid color: ' + [r, g, b, a]);
  }
  return new Float32Array([r, g, b, a]);
}

function newColor3f(r: number, g: number, b: number): Color3f {
  if (r === undefined || g === undefined || b === undefined) {
    throw new Error('Invalid color: ' + [r, g, b]);
  }
  return new Float32Array([r, g, b]);
}

function newColor4fFromHex(hex: string | number): Color4f {
  if (typeof hex === 'string') {
    if (hex.length !== 7 && hex.length !== 9) {
      throw new Error('Invalid hex color: ' + hex);
    }
    let start = hex[0] === '#' ? 1 : 0;
    hex = parseInt(hex.slice(start), 16);
  }
  return new Float32Array([
    ((hex >> 16) & 0xff) / 255,
    ((hex >> 8) & 0xff) / 255,
    (hex & 0xff) / 255,
    1,
  ]);
}

function color4fToHex(color: Color4f): number {
  return (
    (Math.round(color[0] * 255) << 16) +
    (Math.round(color[1] * 255) << 8) +
    Math.round(color[2] * 255)
  );
}

function srgbToLinear(value: Color4f): Color4f {
  const srgbToLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return new Float32Array([
    srgbToLinear(value[0]),
    srgbToLinear(value[1]),
    srgbToLinear(value[2]),
    value[3],
  ]);
}

function fromLinear(value: Color4f): Color4f {
  const linearToSrgb = (c: number) =>
    c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return new Float32Array([
    linearToSrgb(value[0]),
    linearToSrgb(value[1]),
    linearToSrgb(value[2]),
    value[3],
  ]);
}

const White = newColor4f(1, 1, 1, 1);
const Black = newColor4f(0, 0, 0, 1);
const Red = newColor4f(1, 0, 0, 1);
const Green = newColor4f(0, 1, 0, 1);
const Blue = newColor4f(0, 0, 1, 1);
const Yellow = newColor4f(1, 1, 0, 1);
const Cyan = newColor4f(0, 1, 1, 1);
const Magenta = newColor4f(1, 0, 1, 1);

export default {
  newColor4f,
  newColor3f,
  newColor4fFromHex,
  color4fToHex,
  srgbToLinear,
  fromLinear,
  White,
  Black,
  Red,
  Green,
  Blue,
  Yellow,
  Cyan,
  Magenta,
};
