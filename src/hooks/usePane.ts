import {Pane} from "tweakpane";
import type {PaneConfig} from "tweakpane/dist/types/pane/pane-config";
import {onUnmounted} from "vue";

export function usePane(options: PaneConfig): Pane {
    const pane = new Pane(options);
    onUnmounted(() => {
        pane.dispose();
    });
    return pane;
}
