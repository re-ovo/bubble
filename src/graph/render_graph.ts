import RenderContext from '@/pipeline/context';
import { Texture } from '@/resource';

export type TextureId = number;
export type BufferId = number;
export type RGResourceHandle = TextureId | BufferId;

export interface RenderResource {
  id: TextureId | BufferId;
  type: 'texture' | 'buffer';
  name: string;
  transient: boolean; // Whether this resource only lives within the render graph
}

export type TextureSize =
  | GPUExtent3D
  | {
      width: 'full' | `${number}%`;
      height?: 'full' | `${number}%`;
      depthOrArrayLayers?: number;
    };

export interface TextureResource extends RenderResource {
  type: 'texture';
  id: TextureId;
  format: GPUTextureFormat;
  size: TextureSize;
  usage: GPUTextureUsageFlags;
  texture?: GPUTexture; // The actual GPU resource
}

export interface BufferResource extends RenderResource {
  type: 'buffer';
  id: BufferId;
  size: number;
  usage: GPUBufferUsageFlags;
  buffer?: GPUBuffer; // The actual GPU resource
}

export interface RenderPassNode {
  name: string;
  inputs: RGResourceHandle[];
  outputs: RGResourceHandle[];
  execute: (
    encoder: GPUCommandEncoder,
    resources: Map<number, RenderResource>,
  ) => void;
}

export class RenderGraph {
  private _context: RenderContext;

  private passes: RenderPassNode[] = [];
  private resources: Map<number, RenderResource> = new Map();
  private nextResourceId = 0;

  private isCompiled = false;
  private sortedPasses: RenderPassNode[] = [];

  constructor(context: RenderContext) {
    this._context = context;
  }

  get context() {
    return this._context;
  }

  getSortedPasses() {
    if (!this.isCompiled) {
      this.compile();
    }
    return this.sortedPasses;
  }

  // Add a render pass to the graph
  addPass(pass: RenderPassNode) {
    this.passes.push(pass);
  }

  // Create a new texture resource
  createTexture(
    name: string,
    desc: Omit<TextureResource, 'id' | 'type' | 'name'>,
  ): TextureResource {
    const resource: TextureResource = {
      id: this.nextResourceId++,
      type: 'texture',
      name,
      ...desc,
    };
    this.resources.set(resource.id, resource);
    return resource;
  }

  // Create a new buffer resource
  createBuffer(
    name: string,
    desc: Omit<BufferResource, 'id' | 'type' | 'name'>,
  ): BufferResource {
    const resource: BufferResource = {
      id: this.nextResourceId++,
      type: 'buffer',
      name,
      ...desc,
    };
    this.resources.set(resource.id, resource);
    return resource;
  }

  // Execute the render graph
  execute(device: GPUDevice) {
    // 确保图已经编译
    if (!this.isCompiled) {
      this.compile();
    }

    // 分配资源
    this.allocateResources(device);

    // 执行排序后的通道
    const commandEncoder = device.createCommandEncoder();
    for (const pass of this.sortedPasses) {
      pass.execute(commandEncoder, this.resources);
    }

    // 提交命令
    device.queue.submit([commandEncoder.finish()]);

    // 清理临时资源
    this.cleanupTransientResources();
  }

  private topologicalSort(): RenderPassNode[] {
    // Create a map to store the in-degree of each pass
    const inDegree = new Map<RenderPassNode, number>();
    // Create an adjacency list representation of the graph
    const graph = new Map<RenderPassNode, RenderPassNode[]>();

    // Initialize the graph and in-degree counts
    for (const pass of this.passes) {
      inDegree.set(pass, 0);
      graph.set(pass, []);
    }

    // Build the graph by analyzing resource dependencies
    for (const pass of this.passes) {
      // Find passes that depend on this pass's outputs
      for (const otherPass of this.passes) {
        if (pass === otherPass) continue;

        // Check if otherPass uses any of pass's outputs
        if (otherPass.inputs.some((input) => pass.outputs.includes(input))) {
          graph.get(pass)!.push(otherPass);
          inDegree.set(otherPass, inDegree.get(otherPass)! + 1);
        }
      }
    }

    // Perform topological sort using Kahn's algorithm
    const result: RenderPassNode[] = [];
    const queue: RenderPassNode[] = [];

    // Add all nodes with in-degree 0 to queue
    for (const [pass, degree] of inDegree) {
      if (degree === 0) {
        queue.push(pass);
      }
    }

    while (queue.length > 0) {
      const pass = queue.shift()!;
      result.push(pass);

      // Reduce in-degree for all dependent passes
      for (const dependent of graph.get(pass)!) {
        inDegree.set(dependent, inDegree.get(dependent)! - 1);
        if (inDegree.get(dependent) === 0) {
          queue.push(dependent);
        }
      }
    }

    // Check for cycles
    if (result.length !== this.passes.length) {
      throw new Error('Cycle detected in render graph');
    }

    return result;
  }

  private allocateResources(device: GPUDevice) {
    for (const resource of this.resources.values()) {
      if (resource.type === 'texture') {
        const textureResource = resource as TextureResource;
        if (!textureResource.texture) {
          textureResource.texture = device.createTexture({
            size: this.toGPUTextureSize(textureResource.size),
            format: textureResource.format,
            usage: textureResource.usage,
          });
        }
      } else {
        const bufferResource = resource as BufferResource;
        if (!bufferResource.buffer) {
          bufferResource.buffer = device.createBuffer({
            size: bufferResource.size,
            usage: bufferResource.usage,
          });
        }
      }
    }
  }

  private toGPUTextureSize(size: TextureSize): GPUExtent3D {
    // Array size
    if (Symbol.iterator in size) {
      return size;
    }

    // Object size
    const { width, height, depthOrArrayLayers } = size;

    // if the width is a number, then the height must also be a number
    if (typeof width === 'number') {
      return { width, height: height as number, depthOrArrayLayers };
    }

    // So the width is a string, maybe percentage or 'full'
    const finalWidth =
      width === 'full'
        ? this._context.targetSize.width
        : this._context.targetSize.width *
          (Number(width.replace('%', '')) / 100);

    const finalHeight =
      height === 'full'
        ? this._context.targetSize.height
        : typeof height === 'string'
          ? this._context.targetSize.height! *
            (Number(height.replace('%', '')) / 100)
          : height;

    return { width: finalWidth, height: finalHeight, depthOrArrayLayers };
  }

  private cleanupTransientResources() {
    for (const resource of this.resources.values()) {
      if (resource.transient) {
        if (resource.type === 'texture') {
          (resource as TextureResource).texture?.destroy();
        } else {
          (resource as BufferResource).buffer?.destroy();
        }
      }
    }
  }

  // 添加新的编译方法
  compile() {
    // 分析依赖并排序通道
    this.sortedPasses = this.topologicalSort();
    this.isCompiled = true;
  }

  // 添加重置方法，用于需要重新编译图的情况
  reset() {
    this.isCompiled = false;
    this.sortedPasses = [];
    this.cleanupTransientResources();
  }
}
