import {wgsl} from "@/bubble/shader/processor";

let _shaderModule: GPUShaderModule | null = null
let _sampler: GPUSampler | null = null;
let _pipelineCache: Map<GPUTextureFormat, GPURenderPipeline> = new Map();

/**
 * 根据纹理的尺寸，计算出最适合的mip level
 *
 * @param size 纹理的尺寸
 * @returns 最适合的mip level
 */
export function bestMipLevelOfTexture(size: {width: number, height: number}): number {
    if(size.width <= 1 && size.height <= 1) {
        return 1;
    }
    return Math.log2(Math.max(size.width, size.height)) | 0;
}

/**
 * 为纹理生成mipmap
 *
 * @param device GPUDevice
 * @param texture GPUTexture
 */
export function generateMipmap(device: GPUDevice, texture: GPUTexture) {
    if(!_shaderModule) {
        _shaderModule = device.createShaderModule({
            label: 'textured quad shaders for mip level generation',
            code: wgsl`
                struct VSOutput {
                  @builtin(position) position: vec4f,
                  @location(0) texcoord: vec2f,
                };
     
                @vertex fn vs(
                  @builtin(vertex_index) vertexIndex : u32
                ) -> VSOutput {
                  let pos = array(
                    // 1st triangle
                    vec2f( 0.0,  0.0),  // center
                    vec2f( 1.0,  0.0),  // right, center
                    vec2f( 0.0,  1.0),  // center, top
     
                    // 2nd triangle
                    vec2f( 0.0,  1.0),  // center, top
                    vec2f( 1.0,  0.0),  // right, center
                    vec2f( 1.0,  1.0),  // right, top
                  );
     
                  var vsOutput: VSOutput;
                  let xy = pos[vertexIndex];
                  vsOutput.position = vec4f(xy * 2.0 - 1.0, 0.0, 1.0);
                  vsOutput.texcoord = vec2f(xy.x, 1.0 - xy.y);
                  return vsOutput;
                }
     
                @group(0) @binding(0) var ourSampler: sampler;
                @group(0) @binding(1) var ourTexture: texture_2d<f32>;
     
                @fragment fn fs(fsInput: VSOutput) -> @location(0) vec4f {
                  return textureSample(ourTexture, ourSampler, fsInput.texcoord);
                }
            `,
        });
    }
    if(!_sampler) {
        _sampler = device.createSampler({
            minFilter: 'linear',
        });
    }
    let pipeline = _pipelineCache.get(texture.format);
    if(!pipeline) {
        pipeline = device.createRenderPipeline({
            label: 'mip level generator pipeline',
            layout: 'auto',
            vertex: {
                module: _shaderModule,
            },
            fragment: {
                module: _shaderModule,
                targets: [{ format: texture.format }],
            },
        })
        _pipelineCache.set(texture.format, pipeline)
    }
    const commandEncoder = device.createCommandEncoder();

    let width = texture.width;
    let height = texture.height;
    let baseMipLevel = 0;
    while (baseMipLevel < texture.mipLevelCount - 1) {
        width = Math.max(1, width / 2 | 0);
        height = Math.max(1, height / 2 | 0);

        const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: _sampler },
                { binding: 1, resource: texture.createView({baseMipLevel, mipLevelCount: 1}) },
            ],
        });

        // 自增，设置输出的mip level
        ++baseMipLevel;

        const pass = commandEncoder.beginRenderPass({
            label: 'mipmap renderPass',
            colorAttachments: [{
                view: texture.createView({
                    baseMipLevel,
                    mipLevelCount: 1,
                }),
                loadOp: 'clear',
                storeOp: 'store',
            }]
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6);  // call our vertex shader 6 times
        pass.end();
    }

    const commandBuffer = commandEncoder.finish();
    device.queue.submit([commandBuffer]);
}

