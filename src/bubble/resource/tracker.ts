export const resourceVersionSymbol = Symbol('resourceVersion');

/**
 * A tracked resource is an object that has a version number attached to it.
 *
 * The version number is incremented every time a property of the object is modified.
 *
 * This is useful for tracking changes to resources and determining if they are stale.
 *
 * @example
 * ```ts
 * const trackedResource = track({x: 1, y: 2});
 *
 * console.log(getTrackVersion(trackedResource)); // 0
 *
 * trackedResource.x = 3;
 *
 * console.log(getTrackVersion(trackedResource)); // 1
 *
 * console.log(isTracked(trackedResource)); // true
 * ```
 *
 * @template T The type of the object being tracked.
 */
export type Tracked<T extends object> = T & {
    [resourceVersionSymbol]: number;
}

function track<T extends object>(resource: T, delegate?: Tracked<any>): Tracked<T> {
    if (isTracked(resource)) {
        console.warn("Resource is already tracked:", resource);
        return resource;
    }

    if(delegate) {
        const trackedResource: Tracked<T> = resource as Tracked<T>;
        return new Proxy(trackedResource, {
            set(target, property, value) {
                if(property === resourceVersionSymbol) {
                    console.warn("Cannot set version directly.");
                    return Reflect.set(delegate, property, value);
                }
                delegate[resourceVersionSymbol]++;
                return Reflect.set(target, property, value)
            },
            get(target, property) {
                if(property === resourceVersionSymbol) {
                    return delegate[resourceVersionSymbol];
                }
                return Reflect.get(target, property);
            },
            has(target: T & { [resourceVersionSymbol]: number }, p: string | symbol): boolean {
                if(p === resourceVersionSymbol) {
                    return Reflect.has(delegate, p);
                }
                return Reflect.has(target, p);
            },
        })
    }

    const trackedResource: Tracked<T> = resource as Tracked<T>;
    Object.defineProperty(trackedResource, resourceVersionSymbol, {
        enumerable: false,
        value: 0,
        writable: true
    });

    return new Proxy(trackedResource, {
        set(target, property, value) {
            target[resourceVersionSymbol]++;
            return Reflect.set(target, property, value)
        },
    })
}

function isTracked<T extends object>(resource: T): resource is Tracked<T> {
    return resourceVersionSymbol in resource;
}

function getTrackVersion<T extends object>(trackedResource: Tracked<T>): number {
    return trackedResource[resourceVersionSymbol];
}

function resetTrackVersion<T extends object>(trackedResource: Tracked<T>) {
    trackedResource[resourceVersionSymbol] = 0;
}

enum TrackState {
    NOT_TRACKED,
    STALE,
    FRESH,
}

class Tracker<T extends object> {
    private _versionMap = new WeakMap<Tracked<T>, number>();

    getTrackState(resource: Tracked<T>): TrackState {
        const version = this._versionMap.get(resource);
        if (version === undefined) {
            return TrackState.NOT_TRACKED;
        }

        if (version === resource[resourceVersionSymbol]) {
            return TrackState.FRESH;
        }

        return TrackState.STALE;
    }

    getTrackStates(...resources: Tracked<T>[]): TrackState[] {
        return resources.map(resource => this.getTrackState(resource));
    }

    markFresh(...resources: Tracked<T>[]) {
        resources.forEach(resource => {
            this._versionMap.set(resource, resource[resourceVersionSymbol]);
        });
    }

    discard(resource: Tracked<T>) {
        this._versionMap.delete(resource);
    }
}


export {
    track,
    isTracked,
    resetTrackVersion,
    getTrackVersion,
    Tracker,
    TrackState
}
