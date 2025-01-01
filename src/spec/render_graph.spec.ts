import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RenderGraph } from '@/graph/render_graph';
import RenderContext from '@/pipeline/context';

describe('RenderGraph', () => {
  let renderGraph: RenderGraph;
  let mockContext: RenderContext;
  let mockDevice: GPUDevice;

  beforeEach(() => {
    mockContext = {
      targetSize: { width: 800, height: 600 },
    } as RenderContext;

    mockDevice = {
      createTexture: vi.fn().mockReturnValue({ destroy: vi.fn() }),
      createBuffer: vi.fn().mockReturnValue({ destroy: vi.fn() }),
      createCommandEncoder: vi.fn().mockReturnValue({
        finish: vi.fn().mockReturnValue({}),
      }),
      queue: {
        submit: vi.fn(),
      },
    } as unknown as GPUDevice;

    renderGraph = new RenderGraph(mockContext);
  });

  describe('Resource Creation', () => {
    it('should create a texture resource with correct properties', () => {
      const texture = renderGraph.createTexture('test-texture', {
        format: 'rgba8unorm',
        size: { width: 'full', height: 'full' },
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        transient: true,
      });

      expect(texture.type).toBe('texture');
      expect(texture.name).toBe('test-texture');
      expect(texture.format).toBe('rgba8unorm');
      expect(texture.transient).toBe(true);
    });

    it('should create a buffer resource with correct properties', () => {
      const buffer = renderGraph.createBuffer('test-buffer', {
        size: 1024,
        usage: GPUBufferUsage.VERTEX,
        transient: false,
      });

      expect(buffer.type).toBe('buffer');
      expect(buffer.name).toBe('test-buffer');
      expect(buffer.size).toBe(1024);
      expect(buffer.transient).toBe(false);
    });
  });

  describe('Pass Management', () => {
    it('should add a render pass correctly', () => {
      const mockPass = {
        name: 'test-pass',
        inputs: [],
        outputs: [],
        execute: vi.fn(),
      };

      renderGraph.addPass(mockPass);
      renderGraph.compile();
      renderGraph.execute(mockDevice);

      expect(mockPass.execute).toHaveBeenCalled();
    });

    it('should sort passes correctly', () => {
      const pass1 = {
        name: 'pass1',
        inputs: [],
        outputs: [1],
        execute: vi.fn(),
      };
      const pass2 = {
        name: 'pass2',
        inputs: [1],
        outputs: [2],
        execute: vi.fn(),
      };
      const pass3 = {
        name: 'pass3',
        inputs: [2],
        outputs: [3],
        execute: vi.fn(),
      };
      const pass4 = {
        name: 'pass4',
        inputs: [2],
        outputs: [],
        execute: vi.fn(),
      };

      renderGraph.addPass(pass4);
      renderGraph.addPass(pass3);
      renderGraph.addPass(pass2);
      renderGraph.addPass(pass1);

      const sortedPasses = renderGraph.getSortedPasses();
      expect(sortedPasses[0].name).toBe('pass1');
      expect(sortedPasses[1].name).toBe('pass2');

      // pass3和pass4顺序不不确定
      expect(sortedPasses[2].name).toMatch(/^pass[34]$/);
      expect(sortedPasses[3].name).toMatch(/^pass[34]$/);
      expect(sortedPasses[2].name).not.toBe(sortedPasses[3].name);
    });
  });

  describe('Graph Compilation', () => {
    it('should detect cycles in the render graph', () => {
      const resource1 = renderGraph.createTexture('texture1', {
        format: 'rgba8unorm',
        size: { width: 100, height: 100 },
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        transient: true,
      });

      const resource2 = renderGraph.createTexture('texture2', {
        format: 'rgba8unorm',
        size: { width: 100, height: 100 },
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        transient: true,
      });

      // Create a cycle: pass1 -> pass2 -> pass1
      renderGraph.addPass({
        name: 'pass1',
        inputs: [resource2.id],
        outputs: [resource1.id],
        execute: vi.fn(),
      });

      renderGraph.addPass({
        name: 'pass2',
        inputs: [resource1.id],
        outputs: [resource2.id],
        execute: vi.fn(),
      });

      expect(() => renderGraph.compile()).toThrow(
        'Cycle detected in render graph',
      );
    });
  });

  describe('Texture Size Resolution', () => {
    it('should correctly resolve full size textures', () => {
      const texture = renderGraph.createTexture('full-size', {
        format: 'rgba8unorm',
        size: { width: 'full', height: 'full' },
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        transient: true,
      });

      renderGraph.execute(mockDevice);

      expect(mockDevice.createTexture).toHaveBeenCalledWith(
        expect.objectContaining({
          size: {
            width: 800,
            height: 600,
          },
        }),
      );
    });

    it('should correctly resolve percentage size textures', () => {
      const texture = renderGraph.createTexture('half-size', {
        format: 'rgba8unorm',
        size: { width: '50%', height: '50%' },
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        transient: true,
      });

      renderGraph.execute(mockDevice);

      expect(mockDevice.createTexture).toHaveBeenCalledWith(
        expect.objectContaining({
          size: {
            width: 400,
            height: 300,
          },
        }),
      );
    });
  });
});
