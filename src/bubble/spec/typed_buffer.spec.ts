import {describe, expect, it} from 'vitest';
import {basic, struct} from "@/bubble/shader/struct/struct";
import {f32, u32, vec2f, vec3f, vec4f} from "@/bubble/shader/struct/basic_types";

describe('TypedBuffer', () => {
    it('should calculate size and offsets for basic types', () => {
        expect(basic(f32).size).toBe(4);
        expect(basic(vec2f).size).toBe(8);
        expect(basic(vec3f).size).toBe(12);
        expect(basic(vec4f).size).toBe(16);
    });

    it('should calculate size and offsets for simple struct', () => {
        const buffer = struct({
            position: vec3f,
            color: vec4f,
        });

        expect(buffer.size).toBe(32); // 16 (vec3f aligned) + 16 (vec4f)
        expect(buffer.getOffset('position')).toBe(0);
        expect(buffer.getOffset('color')).toBe(16); // aligned to 16
    });

    it('should calculate size and offsets for nested struct', () => {
        const buffer = struct({
            transform: {
                position: vec3f,
                rotation: vec4f,
            },
            scale: f32,
        });

        expect(buffer.size).toBe(48); // 16 (vec3f aligned) + 16 (vec4f) + 16 (float32 aligned)
        expect(buffer.getOffset('transform')).toStrictEqual({
            position: 0,
            rotation: 16,
        })
        expect(buffer.getOffset('scale')).toBe(32); // aligned to 16

        const buffer2 = struct({
            position: vec3f, // 0
            color: vec3f, // 16
            nested: {
                aaa: f32, // 32
                bbb: u32, // 36
            },
        });

        expect(buffer2.size).toBe(48);
        expect(buffer2.getOffset('position')).toBe(0);
        expect(buffer2.getOffset('color')).toBe(16);
        expect(buffer2.getOffset('nested')).toStrictEqual({
            aaa: 28,
            bbb: 32,
        });
    });
});
