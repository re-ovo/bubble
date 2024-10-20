import {Material} from "@/bubble/node/material/material";
import {Shader} from "@/bubble/shader/shader";
import mesh_shader from "@/bubble/shader/mesh/mesh_shader";
import {BufferResource} from "@/bubble/resource/primitive/buffer";
import colors, {type Color4f} from "@/bubble/math/colors";

export class StandardMaterial extends Material {
    constructor() {
        super(new Shader(mesh_shader));

        this.addBuffer("material", new BufferResource("MaterialInfo", GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST))
        this.color = colors.newColor4fFromHex('#FFFFFF')
    }

    get color(): Color4f {
        let view = this.getBufferView("material");
        return colors.fromLinear([view.getFloat32(0), view.getFloat32(4), view.getFloat32(8), view.getFloat32(12)]);
    }

    set color(value: Color4f) {
        // console.log('set color', value)
        const buffer = this.getBuffer("material");
        const view = buffer.view;
        const linear = colors.srgbToLinear(value);
        view.setFloat32(0, linear[0], true);
        view.setFloat32(4, linear[1], true);
        view.setFloat32(8, linear[2], true);
        view.setFloat32(12, linear[3], true);
        buffer.setNeedsUpdate()
    }

    get roughness(): number {
        return this.getBufferView("material").getFloat32(16);
    }

    set roughness(value: number) {
        const buffer = this.getBuffer("material");
        const view = buffer.view;
        view.setFloat32(16, value, true);
        buffer.setNeedsUpdate()
    }

    get metallic(): number {
        return this.getBufferView("material").getFloat32(20);
    }

    set metallic(value: number) {
        const buffer = this.getBuffer("material");
        const view = buffer.view;
        view.setFloat32(20, value, true);
        buffer.setNeedsUpdate()
    }
}
