type BufferHandle = number;
type TextureHandle = number;
type Handle = BufferHandle | TextureHandle;

interface TextureDescription {
  size: GPUExtent3D;
  format: GPUTextureFormat;
  usage: GPUTextureUsageFlags;
  label?: string;
}

interface BufferDescription {
  size: number;
  usage: GPUBufferUsageFlags;
  label?: string;
}

type Resource = {
  handle: TextureHandle | BufferHandle;
  type: 'texture' | 'buffer';
  description: TextureDescription | BufferDescription;
  transientResource?: boolean;
};

interface RenderPass {
  name: string;
  execute: (
    encoder: GPUCommandEncoder,
    resources: Map<Handle, GPUTexture | GPUBuffer>
  ) => void;
  reads: Handle[];
  writes: Handle[];
}

class RenderGraph {
  private device: GPUDevice;
  private resources: Map<Handle, Resource>;
  private passes: RenderPass[];
  private physical_resources: Map<Handle, GPUTexture | GPUBuffer>;

  constructor(device: GPUDevice) {
    this.device = device;
    this.resources = new Map();
    this.passes = [];
    this.physical_resources = new Map();
  }

  // Add a texture resource to the graph
  addTextureResource(
    handle: TextureHandle,
    desc: TextureDescription,
    transient: boolean = false
  ): TextureHandle {
    this.resources.set(handle, {
      handle,
      type: 'texture',
      description: desc,
      transientResource: transient
    });
    return handle;
  }

  // Add a buffer resource to the graph
  addBufferResource(
    handle: BufferHandle,
    desc: BufferDescription,
    transient: boolean = false
  ): BufferHandle {
    this.resources.set(handle, {
      handle,
      type: 'buffer',
      description: desc,
      transientResource: transient
    });
    return handle;
  }

  // Add a render pass to the graph
  addPass(pass: RenderPass): void {
    this.passes.push(pass);
  }

  // Create physical resources
  private createPhysicalResources(): void {
    for (const [handle, resource] of this.resources) {
      if (resource.type === 'texture') {
        const desc = resource.description as TextureDescription;
        const texture = this.device.createTexture({
          size: desc.size,
          format: desc.format,
          usage: desc.usage,
          label: desc.label
        });
        this.physical_resources.set(handle, texture);
      } else {
        const desc = resource.description as BufferDescription;
        const buffer = this.device.createBuffer({
          size: desc.size,
          usage: desc.usage,
          label: desc.label
        });
        this.physical_resources.set(handle, buffer);
      }
    }
  }

  // Compute execution order based on dependencies
  private computeExecutionOrder(): RenderPass[] {
    const visited = new Set<string>();
    const ordered: RenderPass[] = [];

    const visit = (pass: RenderPass) => {
      if (visited.has(pass.name)) return;

      // Visit all dependencies first
      for (const read of pass.reads) {
        const dependentPass = this.passes.find(p => p.writes.includes(read));
        if (dependentPass) {
          visit(dependentPass);
        }
      }

      visited.add(pass.name);
      ordered.push(pass);
    };

    // Visit all passes
    for (const pass of this.passes) {
      visit(pass);
    }

    return ordered;
  }

  // Execute the render graph
  async execute(): Promise<void> {
    // Create physical resources
    this.createPhysicalResources();

    // Compute execution order
    const orderedPasses = this.computeExecutionOrder();

    // Create command encoder
    const commandEncoder = this.device.createCommandEncoder();

    // Execute passes in order
    for (const pass of orderedPasses) {
      pass.execute(commandEncoder, this.physical_resources);
    }

    // Submit commands
    const commandBuffer = commandEncoder.finish();
    this.device.queue.submit([commandBuffer]);

    // Clean up transient resources
    for (const [handle, resource] of this.resources) {
      if (resource.transientResource) {
        const physicalResource = this.physical_resources.get(handle);
        if (physicalResource) {
          if (resource.type === 'texture') {
            (physicalResource as GPUTexture).destroy();
          }
          this.physical_resources.delete(handle);
        }
      }
    }
  }

  // Clean up all resources
  destroy(): void {
    for (const [handle, resource] of this.physical_resources) {
      if (resource instanceof GPUTexture) {
        resource.destroy();
      }
    }
    this.physical_resources.clear();
    this.resources.clear();
    this.passes = [];
  }
}

export { RenderGraph, RenderPass, Resource, Handle };
