import { RenderGraph } from '@/graph/render_graph';
import { UniformBuffer } from '@/resource';

export function setupForwardPass(rg: RenderGraph) {
  const depthTexture = rg.createTexture('depth', {
    size: {
      width: 'full',
      height: 'full',
    },
    transient: true,
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const pass = rg.addPass({
    name: 'forward',
    inputs: [depthTexture.id],
    outputs: [],
    execute: (encoder, resources) => {
      const context = rg.context; // 获取渲染上下文
    },
  });
}
