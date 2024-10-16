import {wgsl} from "@/bubble/shader/processor";
import {describe, expect, it} from "vitest";
import {WgslReflect} from "wgsl_reflect";
import {autoBinding, autoLocation, providerWGSLCounterScope} from "@/bubble/shader/counter";
import camera_input from "@/bubble/shader/common/camera_input";
import exp from "node:constants";

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

    it("test shader counter", () => {
        let ws = providerWGSLCounterScope(() => {
            return wgsl`
                struct TestInterpolation {
                  @location(${autoLocation()}) position: vec4<f32>
                };
                
                @group(0) @binding(${autoBinding(0)}) struct TestInterpolation2 {}
                
                @group(0) @binding(${autoBinding(0)}) struct TestInterpolation3 {}
                
                @group(1) @binding(${autoBinding(1)}) struct TestInterpolation4 {}
                
                @group(0) @binding(${autoBinding(0)}) struct TestInterpolation5 {}
                
                ${camera_input()}
            `
        })


        expect(ws).contains('@location(0) position: vec4<f32>')

        expect(ws).contains('@group(0) @binding(0) struct TestInterpolation2 {}')

        expect(ws).contains('@group(0) @binding(1) struct TestInterpolation3 {}')

        expect(ws).contains('@group(1) @binding(0) struct TestInterpolation4 {}')

        expect(ws).contains('@group(0) @binding(2) struct TestInterpolation5 {}')

        expect(ws).contains('@group(0) @binding(3) var<uniform> camera: CameraInput;')
    })
})
