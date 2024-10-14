import {wgsl} from "@/bubble/shader/processor";
import {describe, expect, it} from "vitest";

describe("WGSL Shader Processor", () => {
    it("test shader interpolation", () => {
        const include = wgsl`
        struct TestInterpolation {
          @location(0) position: vec4<f32>
        };
        `
        const shader = () => wgsl`
            ${include}
            
            @vertex
            fn main(input: TestInterpolation) -> TestInterpolation {
                return input;
            }
        `;

        expect(shader())
            .contains("struct TestInterpolation {")
            .and.contains("fn main(input: TestInterpolation) -> TestInterpolation {");
    })

    it("test conditional marco", () => {
        let condition = false;

        const shader = () => wgsl`
        // just test for if
        #if ${condition}
            let a = 1;
        #else
            let a = 2;   
        #endif 
        `

        condition = false;
        expect(shader()).contains("let a = 2;").and.not.contains("let a = 1;");

        condition = true;
        expect(shader()).contains("let a = 1;").and.not.contains("let a = 2;");
    })
})
