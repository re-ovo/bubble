import { describe, it, bench, expect, beforeEach } from 'vitest';
import { track, isTracked, getTrackVersion, Tracker, TrackState } from '@/bubble/resource/tracker'; // replace with your actual module path

describe('Tracking System', () => {
    let resource: { name: string };
    let trackedResource: ReturnType<typeof track<typeof resource>>;
    let tracker: Tracker<typeof resource>;

    beforeEach(() => {
        resource = { name: 'Resource' };
        trackedResource = track(resource);
        tracker = new Tracker();
    });

    it('should track a resource', () => {
        expect(isTracked(trackedResource)).toBe(true);
        expect(getTrackVersion(trackedResource)).toBe(0);
    });

    it('should increment version on property set', () => {
        trackedResource.name = 'Updated Resource';
        expect(getTrackVersion(trackedResource)).toBe(1);
    });

    it('should return NOT_TRACKED for untracked resource', () => {
        expect(tracker.getTrackState(trackedResource)).toBe(TrackState.NOT_TRACKED);
    });

    it('should return FRESH after marking fresh', () => {
        tracker.markFresh(trackedResource);
        expect(tracker.getTrackState(trackedResource)).toBe(TrackState.FRESH);
    });

    it('should return STALE after modification', () => {
        tracker.markFresh(trackedResource);
        trackedResource.name = 'Another Update';
        expect(tracker.getTrackState(trackedResource)).toBe(TrackState.STALE);
    });

    it('should discard tracking information', () => {
        tracker.markFresh(trackedResource);
        tracker.discard(trackedResource);
        expect(tracker.getTrackState(trackedResource)).toBe(TrackState.NOT_TRACKED);
    });
});
