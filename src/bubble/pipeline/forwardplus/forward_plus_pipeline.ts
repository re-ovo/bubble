import {ScriptablePipeline} from "@/bubble/pipeline/pipeline";
import type {Camera} from "@/bubble/node/camera/camera";
import type {RenderContext} from "@/bubble/pipeline/context";
import {wgsl} from "@/bubble/shader/processor";

export class ForwardPlusPipeline extends ScriptablePipeline {
    render(context: RenderContext, cameras: Camera[]): void {
        for (let i = 0; i < cameras.length; i++) {
            this.renderCamera(context, cameras[i]);
        }
        context.submit();
    }

    dispose(): void {
    }

    renderCamera(context: RenderContext, camera: Camera): void {
        context.beginRenderPass({
            colorAttachments: [{
                view: context.target,
                loadOp: 'clear',
                storeOp: 'store',
            }],
        });

        const bufferData = new Float32Array([
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0,
            0.0, 0.5, 0.0
        ]);
        const buffer = context.device.createBuffer({
            size: bufferData.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        });
        new Float32Array(buffer.getMappedRange()).set(bufferData);
        buffer.unmap();

        const module = context.device.createShaderModule({
            code: wgsl`
          struct VertexInput {
            @location(0) pos: vec3<f32>,
            @builtin(instance_index) instance_index: u32,
          }
          
          struct VertexOutput {
             @builtin(position) pos: vec4<f32>,
             @location(0) color: vec4<f32>,
          }
          
          @vertex
          fn vs(input: VertexInput) -> VertexOutput {
            let colors = array<vec4<f32>, 3>(
                vec4<f32>(1.0, 0.0, 0.0, 1.0),
                vec4<f32>(0.0, 1.0, 0.0, 1.0),
                vec4<f32>(0.0, 0.0, 1.0, 1.0)
            );
             var output: VertexOutput;
             output.pos = vec4<f32>(input.pos + vec3f(f32(input.instance_index) * 0.3), 1.0);
             output.color = colors[input.instance_index % 3];
             return output;
          }
          
          @fragment
          fn fs(input: VertexOutput) -> @location(0) vec4<f32> {
            return input.color;
          }
          `
        })

        const pipeline = context.device.createRenderPipeline({
            vertex: {
                module,
                buffers: [{
                    arrayStride: 3 * 4, // 3 floats per vertex, 4 bytes per float(32bit)
                    attributes: [{
                        shaderLocation: 0,
                        format: 'float32x3',
                        offset: 0
                    }],
                    stepMode: 'vertex'
                }]
            },
            fragment: {
                module,
                targets: [{
                    format: context.targetFormat
                }]
            },
            layout: 'auto',
            depthStencil: {
                format: 'depth24plus',
            }
        })

        context.renderPassEncoder.setPipeline(pipeline);
        context.renderPassEncoder.setVertexBuffer(0, buffer);
        context.renderPassEncoder.draw(3, 100, 0, 0);

        context.endRenderPass();
        context.submit();
    }
}
