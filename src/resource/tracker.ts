export const resourceVersionSymbol = Symbol('resourceVersion');

export type Tracked<T extends object> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any
    ? T[P]
    : T[P] extends object
      ? Tracked<T[P]>
      : T[P];
} & {
  [resourceVersionSymbol]: number;
};

export type MaybeTracked<T extends object> = T | Tracked<T>;

function track<T extends object>(
  value: T,
  delegate?: Tracked<any>,
): Tracked<T> {
  if (isTracked(value)) {
    return value;
  }

  const versionObject =
    delegate ||
    ({
      [resourceVersionSymbol]: 0,
    } as Tracked<T>);

  if (value instanceof Map) {
    return trackMap(value, versionObject) as Tracked<T>;
  }

  return trackObject(value, versionObject);
}

function trackObject<T extends object>(
  value: T,
  versionObject: Tracked<any>,
): Tracked<T> {
  const handler: ProxyHandler<Tracked<T>> = {
    get(target, prop, receiver) {
      if (prop === resourceVersionSymbol) {
        return versionObject[resourceVersionSymbol];
      }
      let propVal = Reflect.get(target, prop, receiver);
      if (typeof propVal === 'function') {
        propVal = propVal.bind(target);
      }
      if (typeof propVal === 'object' && propVal !== null) {
        // track nested objects
        return track(propVal, versionObject);
      }
      return propVal;
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
    },
  };

  return new Proxy(value as Tracked<T>, handler);
}

function trackMap<K, V extends object>(
  map: Map<K, V>,
  versionObject: Tracked<any>,
): Tracked<Map<K, V>> {
  const handler: ProxyHandler<Tracked<Map<K, V>>> = {
    get(target, prop, receiver) {
      if (prop === resourceVersionSymbol) {
        return versionObject[resourceVersionSymbol];
      }
      let propVal = Reflect.get(target, prop, receiver);
      if (typeof propVal === 'function') {
        propVal = propVal.bind(target);
        if (prop === 'get') {
          return (key: K): V => {
            const result = propVal(key);
            if (result && typeof result === 'object') {
              return track(result, versionObject);
            }
            return result;
          };
        }
        if (prop === 'set') {
          return (key: K, value: V) => {
            if (typeof value === 'object' && value !== null) {
              value = unwrapTracked(track(value, versionObject));
            }
            versionObject[resourceVersionSymbol]++;
            return propVal(key, value);
          };
        }
        if (prop === 'delete') {
          return (key: K) => {
            versionObject[resourceVersionSymbol]++;
            return propVal(key);
          };
        }
      }
      return propVal;
    },
    set(target, prop, value, receiver) {
      if (prop === resourceVersionSymbol) {
        versionObject[resourceVersionSymbol] = value;
        return true;
      }
      return Reflect.set(target, prop, value, receiver);
    },
  };

  return new Proxy(map as Tracked<Map<K, V>>, handler);
}

// @ts-ignore
function isTracked<T extends object>(
  value: MaybeTracked<T>,
): value is Tracked<T> {
  return (value as any)[resourceVersionSymbol] !== undefined;
}

function getTrackVersion<T extends object>(
  trackedResource: MaybeTracked<T>,
): number {
  if (!isTracked(trackedResource)) {
    throw new Error('Resource is not tracked: ' + trackedResource);
  }
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

function unwrapTracked<T extends object>(trackedResource: Tracked<T>): T {
  return trackedResource as T;
}

enum TrackState {
  NOT_TRACKED,
  STALE,
  FRESH,
}

class Tracker<T extends object> {
  private _versionMap = new WeakMap<Tracked<T>, number>();

  getTrackState(resource: MaybeTracked<T>): TrackState {
    const version = this._versionMap.get(resource as Tracked<T>);
    if (version === undefined) {
      return TrackState.NOT_TRACKED;
    }

    const trackVersion = getTrackVersion(resource);
    if (version === trackVersion) {
      return TrackState.FRESH;
    }

    return TrackState.STALE;
  }

  getTrackStates(...resources: MaybeTracked<T>[]): TrackState[] {
    return resources.map((resource) => this.getTrackState(resource));
  }

  markFresh(...resources: MaybeTracked<T>[]) {
    resources.forEach((resource) => {
      if (!isTracked(resource)) {
        throw new Error('Resource is not tracked: ' + resource);
      }
      this._versionMap.set(resource, resource[resourceVersionSymbol]);
    });
  }

  discard(resource: MaybeTracked<T>) {
    this._versionMap.delete(resource as Tracked<T>);
  }
}

export {
  track,
  isTracked,
  resetTrackVersion,
  getTrackVersion,
  incrementTrackVersion,
  unwrapTracked,
  Tracker,
  TrackState,
};
