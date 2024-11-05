const resourceVersionSymbol = Symbol('resourceVersion');

export type Tracked<T extends object> = T & {
    [resourceVersionSymbol]: number;
}

function track<T extends object>(resource: T): Tracked<T> {
    if (isTracked(resource)) {
        return resource;
    }

    const trackedResource: Tracked<T> = {
        ...resource,
        [resourceVersionSymbol]: 0,
    }

    // make resourceVersionSymbol not enumerable
    Object.defineProperty(trackedResource, resourceVersionSymbol, {
        enumerable: false,
    });

    return new Proxy(trackedResource, {
        set(target, property, value) {
            target[resourceVersionSymbol]++;
            return Reflect.set(target, property, value)
        }
    })
}

function isTracked<T extends object>(resource: T): resource is Tracked<T> {
    return resourceVersionSymbol in resource;
}

function getTrackVersion<T extends object>(trackedResource: Tracked<T>): number {
    return trackedResource[resourceVersionSymbol];
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

    getTrackStateAndMarkFresh(resource: Tracked<T>): TrackState {
        const state = this.getTrackState(resource);
        this.markFresh(resource);
        return state;
    }

    markFresh(resource: Tracked<T>) {
        this._versionMap.set(resource, resource[resourceVersionSymbol]);
    }

    discard(resource: Tracked<T>) {
        this._versionMap.delete(resource);
    }
}



export {
    track,
    isTracked,
    getTrackVersion,
    Tracker,
    TrackState
}
