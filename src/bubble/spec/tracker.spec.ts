import {beforeEach, describe, expect, it} from 'vitest';
import {
    getTrackVersion,
    isTracked,
    resetTrackVersion,
    resourceVersionSymbol,
    track,
    Tracker,
    TrackState
} from '@/bubble/resource/tracker'; // replace with your actual module path

describe('Tracked Resource', () => {
    let resource: { x: number, y: number, z: { a: number } };
    let trackedResource: any;

    beforeEach(() => {
        resource = {x: 1, y: 2, z: {a: 3}};
        trackedResource = track(resource);
    });

    it('should start with version 0', () => {
        expect(getTrackVersion(trackedResource)).toBe(0);
    });

    it('should increment version when a property is modified', () => {
        trackedResource.x = 3;
        expect(getTrackVersion(trackedResource)).toBe(1);
    });

    it('should identify a resource as tracked', () => {
        expect(isTracked(trackedResource)).toBe(true);
    });

    it('should track nested properties', () => {
        expect(isTracked(trackedResource.z)).toBe(true);
    })

    it('should not define version property on nested properties', () => {
        expect(Reflect.ownKeys(trackedResource.z)).not.toContain(resourceVersionSymbol);
    })

    it('should update version when a nested property is modified', () => {
        resetTrackVersion(trackedResource);
        trackedResource.z.a = 4;
        expect(getTrackVersion(trackedResource)).toBe(1);
        expect(getTrackVersion(trackedResource.z)).toBe(1);
        trackedResource.z.a = 5;
        expect(getTrackVersion(trackedResource)).toBe(2);
        expect(getTrackVersion(trackedResource.z)).toBe(2);
    })

    it('should track nested objects after replacing the object', () => {
        resetTrackVersion(trackedResource);
        trackedResource.z = {a: 4};
        expect(getTrackVersion(trackedResource)).toBe(1);
        expect(getTrackVersion(trackedResource.z)).toBe(1);
        trackedResource.z.a = 5;
        expect(getTrackVersion(trackedResource)).toBe(2);
        expect(getTrackVersion(trackedResource.z)).toBe(2);
    })

    it('should track buffer objects', () => {
        const buffer = new Float32Array([1, 2, 3]);
        const wrapper = {
            buffer: buffer
        }
        const trackedBuffer = track(wrapper);
        resetTrackVersion(trackedBuffer);
        expect(getTrackVersion(trackedBuffer)).toBe(0);
        trackedBuffer.buffer[0] = 4;
        expect(getTrackVersion(trackedBuffer)).toBe(1);
        trackedBuffer.buffer[1] = 5;
        expect(getTrackVersion(trackedBuffer)).toBe(2);
        trackedBuffer.buffer = new Float32Array([1, 2, 3]);
        expect(getTrackVersion(trackedBuffer)).toBe(3);
    })
});

describe('Tracked Resource with Delegate', () => {
    let resource: { x: number };
    let delegateResource: { y: number };
    let trackedResource: any;
    let trackedDelegate: any;

    beforeEach(() => {
        resource = {x: 1};
        delegateResource = {y: 2};
        trackedDelegate = track(delegateResource);
        trackedResource = track(resource, trackedDelegate);
    });

    it('should delegate correctly', () => {
        expect(isTracked(trackedDelegate)).toBe(true);
        expect(isTracked(trackedResource)).toBe(true);
        expect(getTrackVersion(trackedDelegate)).toBe(0);
        expect(getTrackVersion(trackedResource)).toBe(0);
    })

    it('should increment delegate version when a property of the tracked resource is modified', () => {
        expect(getTrackVersion(trackedDelegate)).toBe(0);
        expect(getTrackVersion(trackedResource)).toBe(0);
        trackedResource.x = 3;
        expect(getTrackVersion(trackedDelegate)).toBe(1);
        expect(getTrackVersion(trackedResource)).toBe(1);
    });

    it('should not define version property on tracked resource', () => {
        expect(Reflect.ownKeys(trackedResource)).not.toContain(resourceVersionSymbol);
    })
});


describe('Tracker Class', () => {
    let tracker: Tracker<any>;
    let trackedResource: any;

    beforeEach(() => {
        tracker = new Tracker();
        trackedResource = track({x: 1});
    });

    it('should return NOT_TRACKED if resource is not tracked', () => {
        expect(tracker.getTrackState(trackedResource)).toBe(TrackState.NOT_TRACKED);
    });

    it('should return FRESH if resource version matches tracked version', () => {
        tracker.markFresh(trackedResource);
        expect(tracker.getTrackState(trackedResource)).toBe(TrackState.FRESH);
    });

    it('should return STALE if resource version does not match tracked version', () => {
        tracker.markFresh(trackedResource);
        trackedResource.x = 2;
        expect(tracker.getTrackState(trackedResource)).toBe(TrackState.STALE);
    });

    it('should update track states for multiple resources', () => {
        const anotherResource = track({y: 2});
        tracker.markFresh(trackedResource, anotherResource);
        trackedResource.x = 2;
        expect(tracker.getTrackStates(trackedResource, anotherResource)).toEqual([TrackState.STALE, TrackState.FRESH]);
    });

    it('should discard a resource from tracking', () => {
        tracker.markFresh(trackedResource);
        tracker.discard(trackedResource);
        expect(tracker.getTrackState(trackedResource)).toBe(TrackState.NOT_TRACKED);
    });
});
