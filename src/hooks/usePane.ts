import {Pane} from "tweakpane";
import type {PaneConfig} from "tweakpane/dist/types/pane/pane-config";
import {onUnmounted} from "vue";
import {useFps} from "@vueuse/core";

export function usePane(options: PaneConfig): Pane {
    const pane = new Pane(options);

    // fps frame
    const fps = useFps()
    const folder = pane.addFolder({
        title: 'Statistics',
    })
    folder.addBinding(fps, 'value', {
        label: 'FPS Graph',
        view: 'graph',
        min: 0,
        max: 300,
        readonly: true,
    })
    folder.addBinding(fps, 'value', {
        readonly: true,
        label: 'FPS',
    })

    // dispose
    onUnmounted(() => {
        pane.dispose();
    });

    return pane;
}
