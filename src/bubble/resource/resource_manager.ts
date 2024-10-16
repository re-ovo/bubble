import type {Disposable} from "@/bubble/core/dispose";
import type {RenderContext} from "@/bubble/pipeline/context";
import {ShaderResourceMapper} from "@/bubble/resource/mapper/shader_mapper";
import type {Shader} from "@/bubble/shader/shader";
import {CameraMapper} from "@/bubble/resource/mapper/camera_mapper";
import type {Camera} from "@/bubble/node/camera/camera";

export class ResourceManager implements Disposable {
    private context: RenderContext;

    private cameraMapper: CameraMapper;
    private shaderMapper: ShaderResourceMapper;

    constructor(context: RenderContext) {
        this.context = context;

        this.cameraMapper = new CameraMapper(context);
        this.shaderMapper = new ShaderResourceMapper(context);
    }

    syncCamera(camera: Camera) {
        return this.cameraMapper.sync(camera);
    }

    syncShader(shader: Shader) {
        return this.shaderMapper.sync(shader);
    }

    dispose() {}
}
