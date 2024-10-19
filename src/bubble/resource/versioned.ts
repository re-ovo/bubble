/**
 * 基于版本号的dirty标记系统
 *
 * 当这个对象的数据发生变化时，需要调用setNeedsUpdate方法，这个方法会将version加1
 *
 * 在判断是否需要更新时，通过比较it.version和cacheValue.version来判断
 *
 * 推荐配合VersionedCache使用
 */
export interface Versioned {
    // 版本号，默认为0
    version: number;

    setNeedsUpdate(): void;
}

/**
 * 基于WeakMap的带版本号的缓存系统
 *
 * @template K 缓存的key类型，必须实现Versioned接口
 * @template V 缓存的value类型
 */
export class VersionedCache<K extends Versioned, V> {
    private cache: WeakMap<K, VersionedCacheValue<V>> = new Map();

    get(key: K): VersionedCacheValue<V> | undefined {
        const value = this.cache.get(key);
        if (value) {
            return value;
        }
        return undefined;
    }

    set(key: K, value: V) {
        this.cache.set(key, {
            version: key.version,
            value,
        });
    }

    delete(key: K) {
        this.cache.delete(key);
    }
}

export interface VersionedCacheValue<T> {
    version: number;
    value: T;
}

const updateListener: WeakMap<Versioned, (() => void)[]> = new WeakMap();

export function addUpdateListener<T extends Versioned>(it: T, listener: () => void) {
    let listeners = updateListener.get(it);
    if (!listeners) {
        listeners = [];
        updateListener.set(it, listeners);
    }
    listeners.push(listener);
}

export function notifyUpdate<T extends Versioned>(it: T) {
    const listener = updateListener.get(it);
    if (listener) {
        listener.forEach(it => it());
    }
}
