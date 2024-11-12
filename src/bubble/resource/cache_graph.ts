import type RenderContext from "@/bubble/pipeline/context";
import {Texture, Texture2D} from "@/bubble/resource/texture";
import type {AllocatedTexture} from "@/bubble/resource/allocator";

class CacheGraph {
    private _renderContext: RenderContext;
    private _nodes: Map<any, CacheGraphNode<any>> = new Map();

    constructor(renderContext: RenderContext) {
        this._renderContext = renderContext;
    }

    addNode<K>(key: K, value: CacheValue<K>): void {
        this._nodes.set(key, {
            key,
            value,
        });
    }

    getNodeValue<K>(key: K): CacheValue<K> | undefined {
        const node = this._nodes.get(key);
        return node ? node.value as CacheValue<K> : undefined;
    }

    removeNode<K>(key: K): void {
        this._nodes.delete(key);
    }
}

interface CacheGraphNode<T> {
    key: T;
    value: CacheValue<T>;
}

type CacheValue<K> =
    K extends Texture ? AllocatedTexture :
    never;