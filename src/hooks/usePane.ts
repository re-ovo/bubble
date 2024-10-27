import {FolderApi, Pane} from "tweakpane";
import type {PaneConfig} from "tweakpane/dist/types/pane/pane-config";
import {onUnmounted} from "vue";
import {useFps} from "@vueuse/core";
import type {Scene} from "@/bubble/core/system";
import {loadGltfModel} from "@/bubble/loader/gltf_loader";

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

export function lookupModels(pane: FolderApi, scene: Scene) {
    const models = Object.keys(import.meta.glob('/public/models/**/*.glb'))
        .map((path) => path.slice(7)) // remove /public
        .map((path) => {
            const text = path.split('/').pop()
            const value = path
            return {text, value}
        })

    const model = {
        _value: '',

        get value(): string {
            return this._value
        },

        set value(value: string) {
            this._value = value
            if (value) {
                loadGltfModel(value).then((model) => {
                    model.forEach((m) => scene.addEntity(m))
                })
            }
        }
    }

    pane.addBinding(model, 'value', {
        view: 'list',
        label: 'Models',
        options: models,
    })
}
