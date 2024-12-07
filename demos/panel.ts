import { FolderApi } from 'tweakpane';
import { loadGltfModel, Scene } from '@bubblejs/bubble';

export function lookupModels(pane: FolderApi, scene: Scene) {
  const models = Object.keys(import.meta.glob('/public/models/**/*.(gltf|glb)'))
    .map((path) => path.slice(7)) // remove /public
    .map((path) => {
      const text = path.split('/').pop();
      const value = path;
      return { text, value };
    })
    .sort((a, b) => a.text!.localeCompare(b.text!) || 0);

  const model = {
    _value: '',

    get value(): string {
      return this._value;
    },

    set value(value: string) {
      this._value = value;
      if (value) {
        new Promise(async (resolve) => {
          const entities = await loadGltfModel(value);
          scene.addChildren(entities);
          resolve(entities);
        }).then((r) => {
          console.log('loaded', value);
        });
      }
    },
  };

  pane.addBinding(model, 'value', {
    view: 'list',
    label: 'Models',
    options: models,
  });
}
