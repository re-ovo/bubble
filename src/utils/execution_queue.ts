/**
 * ExecutionQueue
 *
 * It was used to queue up tasks that needed to be delayed by a certain number of frames. The delay can be
 * zero, in which case the execution will be executed in the next `queue.update()` call.
 */
class ExecutionQueue {
    private _executions: Array<() => void> = [];
    private _execution_ids: Array<number> = [];
    private _execution_delays: Array<number> = [];

    /**
     * Push an execution to the queue
     *
     * @param execution The function to execute
     * @param execution_id The id of the execution
     * @param execution_frame_delay The number of frames to delay the execution
     */
    push_execution(
        execution: () => void,
        execution_id: number = 0,
        execution_frame_delay = 0
    ) {
        this._executions.push(execution);
        this._execution_ids.push(execution_id);
        this._execution_delays.push(execution_frame_delay);
    }

    /**
     * Remove an execution from the queue
     * @param executionId The id of the execution to remove
     */
    remove_execution(executionId: number) {
        const index = this._execution_ids.indexOf(executionId);
        if (index !== -1) {
            this._executions.splice(index, 1);
            this._execution_delays.splice(index, 1);
            this._execution_ids.splice(index, 1);
        }
    }

    /**
     * Update the queue
     *
     * This function will execute all the executions in the queue that have reached their frame delay
     */
    update() {
        for (let i = this._executions.length - 1; i >= 0; --i) {
            if (--this._execution_delays[i] < 0) {
                this._executions[i]();
                this._executions.splice(i, 1);
                this._execution_delays.splice(i, 1);
                this._execution_ids.splice(i, 1);
            }
        }
    }

    /**
     * Flush the queue
     *
     * This function will execute all the executions in the queue, regardless of their frame delay
     */
    flush() {
        for (let i = this._executions.length - 1; i >= 0; --i) {
            this._executions[i]();
        }
        this._executions = [];
        this._execution_delays = [];
        this._execution_ids = [];
    }
}

export {ExecutionQueue};
