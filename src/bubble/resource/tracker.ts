const resourceVersionSymbol = Symbol('resourceVersion');

export type Tracked<T extends object> = T & {
    [resourceVersionSymbol]: number;
}

function track<T extends object>(resource: T): Tracked<T> {
    if (isTracked(resource)) {
        console.warn("Resource is already tracked:", resource);
        return resource;
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
    getTrackVersion,
    Tracker,
    TrackState
}
