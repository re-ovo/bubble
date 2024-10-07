import {RendererComponent} from "@/bubble/components/renderer/renderer";
import type {Material} from "@/bubble/material/material";
import type {Mesh} from "@/bubble/core/mesh";

export class MeshRenderer extends RendererComponent {
    mesh?: Mesh;
    material?: Material;
}
