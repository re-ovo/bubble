export interface Versioned {
    version: number;

    setNeedsUpdate(): void;
}

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
