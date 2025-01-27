export interface RenderState {
  cullMode: GPUCullMode;
  blendMode: MaterialBlendMode;
}

export enum MaterialBlendMode {
  OPAQUE,
  BLEND,
}

export function createRenderState(
  state: Partial<RenderState> = {},
): RenderState {
  return {
    cullMode: state.cullMode ?? 'back',
    blendMode: state.blendMode ?? MaterialBlendMode.OPAQUE,
  };
}
