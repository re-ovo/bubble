import {Component} from "@/core/component";
import {Material, StandardMaterial} from "@/node";
import {Entity} from "@/core";

export class RendererComponent extends Component {
    material: Material;

    constructor(entity: Entity) {
        super(entity);
        this.material = defaultMaterial;
    }
}

const defaultMaterial = new StandardMaterial();
