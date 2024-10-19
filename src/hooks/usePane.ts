import {Pane} from "tweakpane";
import type {PaneConfig} from "tweakpane/dist/types/pane/pane-config";
import {onUnmounted} from "vue";
import {useFps} from "@vueuse/core";

export function usePane(options: PaneConfig): Pane {
    const pane = new Pane(options);

    // fps frame
    const fps = useFps()
    pane.addBinding(fps, 'value', {
        label: 'FPS',
        view: 'graph',
        min: 0,
        max: 300,
        readonly: true,
    })

    // dispose
    onUnmounted(() => {
        pane.dispose();
    });

    return pane;
}
