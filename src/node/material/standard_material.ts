import {Material} from "@/node/material/material";
import {Shader} from "@/shader/shader";
import mesh_shader from "@/shader/mesh/mesh_shader";
import colors, {type Color3f, type Color4f} from "@/math/colors";
import {createSolidColorTexture} from "@/loader/texture_loader";
import {Texture2D} from "@/resource/texture";

export class StandardMaterial extends Material {
    constructor() {
        super(new Shader(mesh_shader));

        // default textures
        this.setTexture("albedoMap", defaultBaseColor);
        this.setTexture("normalMap", defaultNormalMap);
        this.setTexture("pbrMap", defaultMetallicMap);
        this.setTexture("emissiveMap", defaultEmissiveMap);
        this.setTexture("occlusionMap", defaultOcclusionMap);

        // default uniform values
        this.setUniform("material", {
            color: colors.White,
            roughness: 1.0, // 1.0 x any = any
            metallic: 1.0, // 1.0 x any = any
            emission: colors.newColor3f(0, 0, 0),
        })
    }

    get color(): Color4f {
        const materialInfo = this.getUniform("material");
        return materialInfo.color;
    }

    set color(value: Color4f) {
        if (value.length !== 4) {
            throw new Error("Color must be a 4-component array.");
        }
        const materialInfo = this.getUniform("material");
        materialInfo.color = value;
        this.setUniform("material", materialInfo);
    }

    get metallic(): number {
        const materialInfo = this.getUniform("material");
        return materialInfo.metallic;
    }

    set metallic(value: number) {
        if (value < 0 || value > 1) {
            throw new Error("Metallic factor must be between 0 and 1.");
        }
        const materialInfo = this.getUniform("material");
        materialInfo.metallic = value;
        this.setUniform("material", materialInfo);
    }

    get roughness(): number {
        const materialInfo = this.getUniform("material");
        return materialInfo.roughness;
    }

    set roughness(value: number) {
        if (value < 0 || value > 1) {
            throw new Error("Roughness factor must be between 0 and 1.");
        }
        const materialInfo = this.getUniform("material");
        materialInfo.roughness = value;
        this.setUniform("material", materialInfo);
    }

    get emission(): Color3f {
        const materialInfo = this.getUniform("material");
        return materialInfo.emission;
    }

    set emission(value: Color3f) {
        if (value.length !== 3) {
            throw new Error("emission factor must be a 3-component array.");
        }
        const materialInfo = this.getUniform("material");
        materialInfo.emission = value;
        this.setUniform("material", materialInfo);
    }
}

const defaultBaseColor = new Texture2D(
    createSolidColorTexture(1, 1, '#FFFFFF'),
    [1, 1],
    'rgba8unorm',
)

const defaultNormalMap = new Texture2D(
    createSolidColorTexture(1, 1, '#8080FF'),
    [1, 1],
    'rgba8unorm',
)

const defaultMetallicMap = new Texture2D(
    createSolidColorTexture(1, 1, '#FFFFFF'),
    [1, 1],
    'rgba8unorm',
)

const defaultRoughnessMap = new Texture2D(
    createSolidColorTexture(1, 1, '#FFFFFF'),
    [1, 1],
    'rgba8unorm',
)

const defaultEmissiveMap = new Texture2D(
    createSolidColorTexture(1, 1, '#000000'),
    [1, 1],
    'rgba8unorm',
)

const defaultOcclusionMap = new Texture2D(
    createSolidColorTexture(1, 1, '#FFFFFF'),
    [1, 1],
    'rgba8unorm',
)
