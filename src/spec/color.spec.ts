import {describe, it, expect} from 'vitest';
import type {Color4f} from "@/math/colors";
import colorUtils from "@/math/colors";

describe('colorUtils', () => {
    it('newColor4f should create a Color4f array', () => {
        const color: Color4f = colorUtils.newColor4f(0.1, 0.2, 0.3, 0.4);
        expect(color[0]).toBeCloseTo(0.1);
        expect(color[1]).toBeCloseTo(0.2);
        expect(color[2]).toBeCloseTo(0.3);
        expect(color[3]).toBeCloseTo(0.4);
    });

    it('newColor4fFromHex should create a Color4f array from hex string', () => {
        const color: Color4f = colorUtils.newColor4fFromHex('#ff5733');
        expect(color[0]).toBeCloseTo(1);
        expect(color[1]).toBeCloseTo(0.3411764705882353);
        expect(color[2]).toBeCloseTo(0.2);
        expect(color[3]).toBeCloseTo(1);
    });

    it('newColor4fFromHex should create a Color4f array from hex number', () => {
        const color: Color4f = colorUtils.newColor4fFromHex(0xff5733);
        expect(color[0]).toBeCloseTo(1);
        expect(color[1]).toBeCloseTo(0.3411764705882353);
        expect(color[2]).toBeCloseTo(0.2);
        expect(color[3]).toBeCloseTo(1);
    });

    it('color4fToHex should convert Color4f array to hex number', () => {
        const hex: number = colorUtils.color4fToHex(new Float32Array([1, 0.3411764705882353, 0.2, 1]));
        expect(hex).toBe(0xff5733);
    });

    it('srgbToLinear should convert sRGB Color4f to linear Color4f', () => {
        const linearColor: Color4f = colorUtils.srgbToLinear(new Float32Array([0.5, 0.5, 0.5, 1]));
        expect(linearColor[0]).toBeCloseTo(0.21404114048223255);
        expect(linearColor[1]).toBeCloseTo(0.21404114048223255);
        expect(linearColor[2]).toBeCloseTo(0.21404114048223255);
        expect(linearColor[3]).toBeCloseTo(1);
    });

    it('fromLinear should convert linear Color4f to sRGB Color4f', () => {
        const srgbColor: Color4f = colorUtils.fromLinear(new Float32Array([0.21404114048223255, 0.21404114048223255, 0.21404114048223255, 1]));
        expect(srgbColor[0]).toBeCloseTo(0.5);
        expect(srgbColor[1]).toBeCloseTo(0.5);
        expect(srgbColor[2]).toBeCloseTo(0.5);
        expect(srgbColor[3]).toBeCloseTo(1);
    });
});
