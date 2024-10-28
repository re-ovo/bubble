import type {Shader} from "@/bubble/shader/shader";

export class PipelineBuilder {
    private _shader: Shader | null = null;

    setShader(shader: Shader) {
        this._shader = shader;
        return this;
    }

    setVertexAttribute(name: string) {

        return this;
    }

    setUniform(name: string) {

        return this;
    }

    build() {

    }
}
