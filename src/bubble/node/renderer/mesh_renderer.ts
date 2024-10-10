import {RendererComponent} from "@/bubble/node/renderer/renderer";
import type {Material} from "@/bubble/node/material/material";
import type {Mesh} from "@/bubble/node/mesh/mesh";

export class MeshRenderer extends RendererComponent {
    mesh?: Mesh;
    material?: Material;
}
