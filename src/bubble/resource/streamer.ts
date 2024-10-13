import type {Disposable} from "@/bubble/core/dispose";
import type {ScriptableRenderContext} from "@/bubble/pipeline/pipeline";
import {Shader} from "@/bubble/shader/shader";
import {ShaderStreamer} from "@/bubble/resource/shader_streamer";

/**
 * 代表一个可以被流送到GPU的对象
 */
export interface Streamable {
    /**
     * 是否应该重新同步数据, 默认应该为false, 因为第一次会自动创建
     */
    needSync: boolean;
}

/**
 * 代表一个可以被流送到GPU的对象
 *
 * @param T 代表一个可以被流送到GPU的对象
 * @param R 代表一个可以被流送到GPU的对象的资源
 */
export abstract class ResourceStreamer<T extends Streamable, R> implements Disposable {
    protected readonly resources: Map<T, R> = new Map<T, R>()
    protected readonly context: ScriptableRenderContext

    constructor(ctx: ScriptableRenderContext) {
        this.context = ctx
    }

    getCache(resource: T): R | undefined {
        return this.resources.get(resource)
    }

    protected abstract create(resource: T): R

    protected abstract update(resource: T): R

    protected abstract disposeResource(resource: R): void

    sync(resource: T): R {
        let res = this.resources.get(resource)
        if (res === undefined) {
            res = this.create(resource)
            this.resources.set(resource, res)
        } else {
            res = this.update(resource)
        }
        resource.needSync = false
        return res
    }

    // dispose all cached resources
    dispose(): void {
        this.resources.forEach((value) => {
            this.disposeResource(value)
        })
        this.resources.clear()
    }
}
