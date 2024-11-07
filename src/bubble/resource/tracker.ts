export const resourceVersionSymbol = Symbol('resourceVersion');

export type Tracked<T extends object> = {
    [P in keyof T]: T[P] extends object ? MaybeTracked<T[P]> : T[P];
} & {
    [resourceVersionSymbol]: number;
};

export type MaybeTracked<T extends object> = T | Tracked<T>;

function track<T extends object>(value: T, delegate?: Tracked<any>): Tracked<T> {
    if (isTracked(value)) {
        return value;
    }

    const versionObject = delegate || {
        [resourceVersionSymbol]: 0
    } as Tracked<T>;

    const handler: ProxyHandler<Tracked<T>> = {
        get(target, prop, receiver) {
            if (prop === resourceVersionSymbol) {
                return versionObject[resourceVersionSymbol];
            }
            const propVal = Reflect.get(target, prop, receiver);
            if (typeof propVal === 'object' && propVal !== null) {
                // track nested objects
                return track(propVal, versionObject);
            }
        },
        set(target, prop, value, receiver) {
            if (prop === resourceVersionSymbol) {
                versionObject[resourceVersionSymbol] = value;
                return true;
            }
            if (typeof value === 'object' && value !== null) {
                value = track(value, versionObject);
            }
            versionObject[resourceVersionSymbol]++;
            return Reflect.set(target, prop, value, receiver);
        }
    }

    return new Proxy(value as Tracked<T>, handler);
}

// @ts-ignore
function isTracked<T extends object>(value: MaybeTracked<T>): value is Tracked<T> {
    return (value as any)[resourceVersionSymbol] !== undefined;
}

function getTrackVersion<T extends object>(trackedResource: MaybeTracked<T>): number {
    return (trackedResource as Tracked<T>)[resourceVersionSymbol] || 0;
}

function resetTrackVersion<T extends object>(trackedResource: Tracked<T>) {
    if (isTracked(trackedResource)) {
        trackedResource[resourceVersionSymbol] = 0;
    } else {
        throw new Error('Resource is not tracked');
    }
}

function incrementTrackVersion<T extends object>(trackedResource: Tracked<T>) {
    if (!isTracked(trackedResource)) {
        throw new Error('Resource is not tracked');
    }
    trackedResource[resourceVersionSymbol]++;
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
