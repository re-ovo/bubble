import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RenderGraph,
  RenderPassNode,
  TextureResource,
  BufferResource,
} from '@/graph/render_graph';
import RenderContext from '@/pipeline/context';

describe('RenderGraph', () => {
  let mockContext: RenderContext;
  let renderGraph: RenderGraph;
  let mockDevice: GPUDevice;

  beforeEach(() => {
    mockContext = {
      targetSize: { width: 1920, height: 1080 },
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
        size: { width: 1920, height: 1080 },
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
        usage: GPUBufferUsage.STORAGE,
        transient: false,
      });

      expect(buffer.type).toBe('buffer');
      expect(buffer.name).toBe('test-buffer');
      expect(buffer.size).toBe(1024);
      expect(buffer.transient).toBe(false);
    });
  });

  describe('Pass Management', () => {
    it('should add render passes correctly', () => {
      const mockPass: RenderPassNode = {
        name: 'test-pass',
        inputs: [],
        outputs: [],
        execute: vi.fn(),
      };

      renderGraph.addPass(mockPass);
      renderGraph.compile();

      // Execute should trigger the pass
      renderGraph.execute(mockDevice);
      expect(mockPass.execute).toHaveBeenCalled();
    });

    it('should sort passes correctly', () => {
      const passA: RenderPassNode = {
        name: 'pass-a',
        inputs: [],
        outputs: [{ id: 1, type: 'texture', name: 'tex-a', transient: true }],
        execute: vi.fn(),
      };

      const passB: RenderPassNode = {
        name: 'pass-b',
        inputs: [{ id: 1, type: 'texture', name: 'tex-a', transient: true }],
        outputs: [{ id: 2, type: 'texture', name: 'tex-b', transient: true }],
        execute: vi.fn(),
      };

      const passC: RenderPassNode = {
        name: 'pass-c',
        inputs: [{ id: 2, type: 'texture', name: 'tex-b', transient: true }],
        outputs: [{ id: 3, type: 'texture', name: 'tex-c', transient: true }],
        execute: vi.fn(),
      };

      // Add passes in random order
      renderGraph.addPass(passC);
      renderGraph.addPass(passA);
      renderGraph.addPass(passB);

      renderGraph.compile();
      renderGraph.execute(mockDevice);

      const executionOrder = vi.mocked(passA.execute).mock
        .invocationCallOrder[0];
      const executionOrderB = vi.mocked(passB.execute).mock
        .invocationCallOrder[0];
      const executionOrderC = vi.mocked(passC.execute).mock
        .invocationCallOrder[0];

      console.log(executionOrder, executionOrderB, executionOrderC);

      expect(executionOrder).toBeLessThan(executionOrderB);
      expect(executionOrderB).toBeLessThan(executionOrderC);
    });

    it('should detect cycles in render graph', () => {
      const passA: RenderPassNode = {
        name: 'pass-a',
        inputs: [],
        outputs: [{ id: 1, type: 'texture', name: 'tex-a', transient: true }],
        execute: vi.fn(),
      };

      const passB: RenderPassNode = {
        name: 'pass-b',
        inputs: [{ id: 1, type: 'texture', name: 'tex-a', transient: true }],
        outputs: [{ id: 2, type: 'texture', name: 'tex-b', transient: true }],
        execute: vi.fn(),
      };

      const passC: RenderPassNode = {
        name: 'pass-c',
        inputs: [{ id: 2, type: 'texture', name: 'tex-b', transient: true }],
        outputs: [{ id: 1, type: 'texture', name: 'tex-a', transient: true }], // Creates a cycle
        execute: vi.fn(),
      };

      renderGraph.addPass(passA);
      renderGraph.addPass(passB);
      renderGraph.addPass(passC);

      expect(() => renderGraph.compile()).toThrow(
        'Cycle detected in render graph',
      );
    });
  });

  describe('Resource Allocation', () => {
    it('should allocate GPU resources during execution', () => {
      const texture = renderGraph.createTexture('test-texture', {
        format: 'rgba8unorm',
        size: { width: 1920, height: 1080 },
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        transient: true,
      });

      const mockPass: RenderPassNode = {
        name: 'test-pass',
        inputs: [],
        outputs: [texture],
        execute: vi.fn(),
      };

      renderGraph.addPass(mockPass);
      renderGraph.execute(mockDevice);

      expect(mockDevice.createTexture).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup transient resources after execution', () => {
      const texture = renderGraph.createTexture('test-texture', {
        format: 'rgba8unorm',
        size: { width: 1920, height: 1080 },
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        transient: true,
      });

      const mockPass: RenderPassNode = {
        name: 'test-pass',
        inputs: [],
        outputs: [texture],
        execute: vi.fn(),
      };

      renderGraph.addPass(mockPass);
      renderGraph.execute(mockDevice);

      // After execution, transient textures should be destroyed
      const mockTexture = mockDevice.createTexture({
        size: { width: 1, height: 1 },
        format: 'rgba8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
      expect(mockTexture.destroy).toHaveBeenCalled();
    });
  });
});
