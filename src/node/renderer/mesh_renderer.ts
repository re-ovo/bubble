import { RendererComponent } from '@/node/renderer/renderer';
import { Mesh } from '@/node/mesh/mesh';
import { Entity } from '@/core';

export class MeshRendererComponent extends RendererComponent {
  mesh: Mesh;
  constructor(entity: Entity) {
    super(entity);
    this.mesh = defaultMesh;
  }
}

const defaultMesh = new Mesh();
