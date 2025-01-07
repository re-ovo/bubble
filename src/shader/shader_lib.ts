// brdf
import cooktorrance from './sources/brdf/cooktorrance.wgsl?raw';

// tonemapping
import gamma from './sources/tonemapping/gamma.wgsl?raw';

// common
import camera from './sources/common/camera.wgsl?raw';
import constants from './sources/common/constants.wgsl?raw';
import model from './sources/common/model.wgsl?raw';
import converts from './sources/common/converts.wgsl?raw';

// ts
import { ShaderDefs, ShaderDefValue, ShaderLibrary } from 'naga-oil-wasm';

export class ShaderManager {
  private static _instance: ShaderManager;
  private _composables: Set<string> = new Set();

  private constructor() {}

  static getInstance() {
    if (!this._instance) {
      this._instance = new ShaderManager();

      // register composables
      this._instance.registerComposable(gamma);
      this._instance.registerComposable(camera);
      this._instance.registerComposable(constants);
      this._instance.registerComposable(model);
      this._instance.registerComposable(cooktorrance);
      this._instance.registerComposable(converts);
    }
    return this._instance;
  }

  registerComposable(code: string) {
    this._composables.add(code);
  }

  process(code: string, defs: Record<string, boolean | number>) {
    const composer = new ShaderLibrary();
    this._composables.forEach((v) => composer.register_module(v));
    const shaderDefs = new ShaderDefs();
    Object.entries(defs).forEach(([k, v]) => {
      if (typeof v === 'boolean') {
        shaderDefs.add(k, ShaderDefValue.new_bool(v));
      } else {
        shaderDefs.add(k, ShaderDefValue.new_int(v));
      }
    });
    return composer.process(code, shaderDefs);
  }
}
