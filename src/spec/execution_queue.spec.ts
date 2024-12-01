import {ExecutionQueue} from "@/utils";
import {beforeEach, describe, expect, it, vi} from "vitest";

describe('ExecutionQueue', () => {
    it('should execute tasks without delay on update', () => {
        const queue = new ExecutionQueue();
        const mockFn = vi.fn();

        queue.push_execution(mockFn, 1, 0);
        queue.update();

        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should execute tasks after the specified delay', () => {
        const queue = new ExecutionQueue();
        const mockFn = vi.fn();

        queue.push_execution(mockFn, 1, 2);
        queue.update();
        queue.update();
        queue.update();

        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should not execute tasks before the delay', () => {
        const queue = new ExecutionQueue();
        const mockFn = vi.fn();

        queue.push_execution(mockFn, 1, 2);
        queue.update();
        queue.update();

        expect(mockFn).not.toHaveBeenCalled();
    });

    it('should remove tasks from the queue', () => {
        const queue = new ExecutionQueue();
        const mockFn = vi.fn();

        queue.push_execution(mockFn, 1, 0);
        queue.remove_execution(1);
        queue.update();

        expect(mockFn).not.toHaveBeenCalled();
    });

    it('should flush the queue and execute all tasks immediately', () => {
        const queue = new ExecutionQueue();
        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();

        queue.push_execution(mockFn1, 1, 5);
        queue.push_execution(mockFn2, 2, 10);
        queue.flush();

        expect(mockFn1).toHaveBeenCalledTimes(1);
        expect(mockFn2).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple tasks with different delays', () => {
        const queue = new ExecutionQueue();
        const mockFn1 = vi.fn();
        const mockFn2 = vi.fn();

        queue.push_execution(mockFn1, 1, 1);
        queue.push_execution(mockFn2, 2, 2);

        queue.update();
        expect(mockFn1).toHaveBeenCalledTimes(0);
        expect(mockFn2).toHaveBeenCalledTimes(0);

        queue.update();
        expect(mockFn1).toHaveBeenCalledTimes(1);
        expect(mockFn2).toHaveBeenCalledTimes(0);

        queue.update();
        expect(mockFn1).toHaveBeenCalledTimes(1);
        expect(mockFn2).toHaveBeenCalledTimes(1);
    });
});
