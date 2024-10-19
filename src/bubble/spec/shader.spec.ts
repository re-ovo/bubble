import {wgsl} from "@/bubble/shader/processor";
import {describe, expect, it} from "vitest";
import {autoBinding, autoLocation, providerWGSLCounterScope} from "@/bubble/shader/counter";
import camera_input from "@/bubble/shader/common/camera_input";
import {Shader} from "@/bubble/shader/shader";

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

    it("test shader attribute reflection", () => {
        let shader = new Shader(() => wgsl`
        struct VertexInput {
           @builtin(vertex_index) index: u32,
           @builtin(instance_index) instance: u32,
           @location(0) position: vec4<f32>,
           @location(1) normal: vec3<f32>,
           @location(2) uv: vec2<f32>,
        }
        
        struct VertexOutput {
           @builtin(position) position: vec4<f32>,
        }
        
        struct NestTest {
            test: vec4<f32>,
        }
        
        struct CameraInput {
              view: mat4x4<f32>,
              projection: mat4x4<f32>,
              viewProjection: mat4x4<f32>,
              cameraPosition: vec3<f32>,
              nested: NestTest,
        }
        
        @group(0) @binding(0) var<uniform> camera: CameraInput; 
        
        @vertex
        fn main(input: VertexInput) -> VertexInput {
            return input;
        }
      `)
        shader.evaluate()
        expect(shader.attributes).toStrictEqual([
            {
                "location": 0,
                "name": "position",
                "type": {
                    "name": "vec4",
                    "size": 16,
                },
            },
            {
                "location": 1,
                "name": "normal",
                "type": {
                    "name": "vec3",
                    "size": 12,
                },
            },
            {
                "location": 2,
                "name": "uv",
                "type": {
                    "name": "vec2",
                    "size": 8,
                },
            },
        ])
    })

    it("test shader uniform reflection", () => {
        const shader = new Shader(() => wgsl`
        struct CameraInput {
              view: mat4x4<f32>,
              projection: mat4x4<f32>,
              viewProjection: mat4x4<f32>,
              cameraPosition: vec3<f32>,
        }
        
        struct PointLight {
                position: vec3<f32>,
                color: vec3<f32>,
                intensity: f32,
        }
        
        struct PointLightArray {
               num: u32,
               lights: array<PointLight>,
        }
        
        @group(0) @binding(0) var<uniform> camera: CameraInput;
        @group(0) @binding(1) var<storage> pointLights: PointLightArray;
            
        @vertex
        fn main() {}
        `)
        shader.evaluate()
        console.log(shader.metadata.storage[0])
    })
})
