import { describe, it, expect } from 'vitest';
import type {Color4f} from "@/bubble/math/colors";
import colorUtils from "@/bubble/math/colors";

describe('colorUtils', () => {
    it('newColor4f should create a Color4f array', () => {
        const color: Color4f = colorUtils.newColor4f(0.1, 0.2, 0.3, 0.4);
        expect(color).toEqual([0.1, 0.2, 0.3, 0.4]);
    });

    it('newColor4fFromHex should create a Color4f array from hex string', () => {
        const color: Color4f = colorUtils.newColor4fFromHex('#ff5733');
        expect(color).toEqual([1, 0.3411764705882353, 0.2, 1]);
    });

    it('newColor4fFromHex should create a Color4f array from hex number', () => {
        const color: Color4f = colorUtils.newColor4fFromHex(0xff5733);
        expect(color).toEqual([1, 0.3411764705882353, 0.2, 1]);
    });

    it('color4fToHex should convert Color4f array to hex number', () => {
        const hex: number = colorUtils.color4fToHex([1, 0.3411764705882353, 0.2, 1]);
        expect(hex).toBe(0xff5733);
    });

    it('srgbToLinear should convert sRGB Color4f to linear Color4f', () => {
        const linearColor: Color4f = colorUtils.srgbToLinear([0.5, 0.5, 0.5, 1]);
        expect(linearColor).toEqual([0.21404114048223255, 0.21404114048223255, 0.21404114048223255, 1]);
    });

    it('fromLinear should convert linear Color4f to sRGB Color4f', () => {
        const srgbColor: Color4f = colorUtils.fromLinear([0.21404114048223255, 0.21404114048223255, 0.21404114048223255, 1]);
        expect(srgbColor).toEqual([0.5, 0.5, 0.5, 1]);
    });
});
