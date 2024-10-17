import type {Versioned} from "@/bubble/resource/versioned";

/**
 * ResourceMapper负责将资源对象映射到GPU资源对象, 例如将Texture对象映射到GPUTexture, GPUSampler, GPUTextureView等对象
 *
 * @template T 资源对象类型
 * @template R GPU资源对象类型
 */
export interface ResourceMapper<T extends Versioned, R> {
    sync(resource: T): R;

    /**
     * 创建GPU资源对象 (无副作用，不要操作cache)
     *
     * @param resource 资源对象
     */
    create(resource: T): R;

    /**
     * 更新GPU资源对象 (无副作用，不要操作cache)
     *
     * @param resource 资源对象
     * @param gpu GPU资源对象
     */
    update(resource: T, gpu: R): R;

    /**
     * 释放GPU资源对象 (无副作用，不要操作cache)
     *
     * @param resource 资源对象
     * @param gpu GPU资源对象
     */
    dispose(resource: T, gpu: R): void;
}
