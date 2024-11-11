import type {Shader} from "@/bubble/resource/shader";
import {uuid_v4} from "@/bubble/math/maths";
import type {VertexAttribute} from "@/bubble/resource/attribute";

class RenderPipelineBuilder {
    private _label: string;

    private _shader: Shader | null = null;
    private _vertexBuffers: GPUVertexBufferLayout[] = [];
    private _fragmentTargets: GPUColorTargetState[] = [];
    private _bindGroupLayouts: GPUBindGroupLayout[] = [];

    // primitive state
    private _primitive: GPUPrimitiveState = {}

    // depth stencil state
    private _depthStencil: GPUDepthStencilState | null = null;

    constructor(label?: string) {
        this._label = label ?? `RenderPipeline[${uuid_v4()}]`;
    }

    setLabel(label: string) {
        this._label = label;
        return this;
    }

    setShader(shader: Shader) {
        this._shader = shader;
        return this;
    }

    addRenderTarget(
        format: GPUTextureFormat,
        blend?: GPUBlendState,
    ) {
        this._fragmentTargets.push({
            format,
            blend,
        })
        return this;
    }

    setVertexAttribute(name: string, buffer: VertexAttribute) {
        if (!this._shader) {
            throw new Error('Shader is not set');
        }

        // Find the attribute in the shader, make sure it exists (avoid runtime errors)
        const reflectionAttribute = this._shader.attributes
            .find((attribute) => attribute.name === name);

        if (reflectionAttribute) {
            // Each attribute is a vertex buffer, maybe we can merge them into one buffer in the future
            this._vertexBuffers[reflectionAttribute.location] = {
                arrayStride: buffer.stride,
                stepMode: buffer.stepMode,
                attributes: [reflectionAttribute.attributeDesc],
            }
        } else {
            console.warn(`Attribute ${name} not found in shader`);
        }
        return this;
    }

    setCullMode(cullMode: GPUCullMode) {
        this._primitive.cullMode = cullMode;
        return this;
    }

    setFrontFace(frontFace: GPUFrontFace) {
        this._primitive.frontFace = frontFace;
        return this;
    }

    setPolygonMode(topology: GPUPrimitiveTopology) {
        this._primitive.topology = topology;
        return this;
    }

    setDepthStencil(depthStencil: GPUDepthStencilState) {
        this._depthStencil = depthStencil;
        return this;
    }

    addBindGroupLayout(layout: GPUBindGroupLayout) {
        this._bindGroupLayouts.push(layout);
        return this;
    }

    build(device: GPUDevice): GPURenderPipeline {
        if (!this._shader) {
            throw new Error('Shader is not set');
        }
        if (this._fragmentTargets.length === 0) {
            throw new Error('No render target is set');
        }
        if (this._vertexBuffers.length === 0) {
            throw new Error('No vertex buffer is set');
        }
        if(this._vertexBuffers.find((buffer) => !buffer)) {
            throw new Error('Some vertex buffer is missing: ' + this._vertexBuffers);
        }
        if (this._bindGroupLayouts.length === 0) {
            throw new Error('No bind group layout is set');
        }
        const shaderModule = device.createShaderModule({
            code: this._shader.code,
        })

        return device.createRenderPipeline({
            label: this._label,
            vertex: {
                module: shaderModule,
                buffers: this._vertexBuffers,
            },
            fragment: {
                module: shaderModule,
                targets: this._fragmentTargets,
            },
            layout: device.createPipelineLayout({
                bindGroupLayouts: this._bindGroupLayouts,
            }),
            primitive: this._primitive,
        });
    }
}