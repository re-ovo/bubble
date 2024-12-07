import {
  CameraDirtyFlag,
  MeshRendererComponent,
  RendererComponent,
} from '@/node';
import type { Camera } from '@/node/camera/camera';
import type RenderContext from '@/pipeline/context';
import { ScriptablePipeline } from '@/pipeline/pipeline';
import { UniformBuffer } from '@/resource';
import camera_input, { cameraVariable } from '@/shader/common/camera_input';
import { RendererList } from '@/pipeline/renderer_list';
import { TransformDirtyFlag } from '@/core';

export class ForwardPlusPipeline extends ScriptablePipeline {
  private _rendererList: RendererList | null = null;

  render(context: RenderContext, cameras: Camera[]): void {
    for (let i = 0; i < cameras.length; i++) {
      this.renderCamera(context, cameras[i]);
    }
    context.submit();
  }

  dispose(): void {}

  depthTexture: GPUTexture | null = null;

  cameraUniformBuffer = UniformBuffer.ofDefinition(camera_input);

  renderCamera(context: RenderContext, camera: Camera): void {
    if (!this.depthTexture) {
      this.depthTexture = context.device.createTexture({
        size: context.targetSize,
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }
    if (
      this.depthTexture.width != context.targetSize.width ||
      this.depthTexture.height != context.targetSize.height
    ) {
      this.depthTexture.destroy();
      this.depthTexture = context.device.createTexture({
        size: context.targetSize,
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }

    // prepare render list
    if (!this._rendererList) {
      this._rendererList = new RendererList(context, camera);
    }
    this._rendererList.update();

    // set camera uniform buffer
    if (
      camera.parent!.entity!.transform!.isDirty(
        TransformDirtyFlag.UPLOAD_DATA,
      ) ||
      camera.isDirty(CameraDirtyFlag.PROJECTION_MATRIX)
    ) {
      this.cameraUniformBuffer.writeStructuredData(
        {
          projectionMatrix: camera.projectionMatrix,
          viewMatrixInverse:
            camera.parent!.entity!.transform.transformMatrixInverse,
          cameraPosition: camera.parent!.entity!.transform.worldPosition,
        },
        cameraVariable,
      );

      camera.parent!.entity!.transform.clearDirty(
        TransformDirtyFlag.UPLOAD_DATA,
      );
      camera.clearDirty(CameraDirtyFlag.PROJECTION_MATRIX);
    }
    // console.log(camera.parent!.entity!.transform.transformMatrixInverse)

    context.beginRenderPass({
      colorAttachments: [
        {
          view: context.target,
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        depthClearValue: 1.0,
      },
    });

    this.renderEntities(context, this._rendererList.renderObjects);

    context.endRenderPass();
  }

  renderEntities(context: RenderContext, entities: RendererComponent[]) {
    for (let i = 0; i < entities.length; i++) {
      const renderer = entities[i];
      if (renderer instanceof MeshRendererComponent) {
        this.renderMeshRenderer(context, renderer);
      }
    }
  }

  renderMeshRenderer(context: RenderContext, renderer: MeshRendererComponent) {
    const mesh = renderer.mesh!;
    const material = renderer.material!;
    const passEncoder = context.renderPassEncoder;

    const pipeline = context.renderCache.requestRenderPipeline(material, mesh);
    passEncoder.setPipeline(pipeline);

    material.shader.attributes.forEach((attribute) => {
      if (!mesh.attributes.has(attribute.name)) {
        console.warn(`Attribute ${attribute.name} not found in mesh`);
      }
      const buffer = context.renderCache.requestVertexBuffer(
        mesh.attributes.get(attribute.name)!,
      );
      passEncoder.setVertexBuffer(
        attribute.location,
        buffer.buffer,
        buffer.offset,
        buffer.size,
      );
    });

    const bindGroup = context.renderCache.requestBindGroup(
      renderer,
      this.cameraUniformBuffer,
    );
    bindGroup.forEach(({ groupId, groupVal }) => {
      passEncoder.setBindGroup(groupId, groupVal);
    });

    if (mesh.indices) {
      const indexBuffer = context.renderCache.requestVertexBuffer(
        mesh.indices!,
      );
      const format: GPUIndexFormat =
        mesh.indices.data instanceof Uint16Array ? 'uint16' : 'uint32';
      passEncoder.setIndexBuffer(
        indexBuffer.buffer,
        format,
        indexBuffer.offset,
        indexBuffer.size,
      );
      passEncoder.drawIndexed(mesh.drawCount);
    } else {
      passEncoder.draw(mesh.drawCount);
    }
  }
}
