import {RendererComponent} from "@/bubble/renderer/renderer";
import type {Material} from "@/bubble/material/material";
import type {Mesh} from "@/bubble/mesh/mesh";

export class MeshRenderer extends RendererComponent {
    mesh?: Mesh;
    material?: Material;
}
