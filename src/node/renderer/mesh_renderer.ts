import {RendererComponent} from "@/node/renderer/renderer";
import type {Material} from "@/node/material/material";
import type {Mesh} from "@/node/mesh/mesh";

export class MeshRendererComponent extends RendererComponent {
    mesh?: Mesh;
    material?: Material;
}
