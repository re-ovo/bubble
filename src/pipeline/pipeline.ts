import type { Camera } from '@/node/camera/camera';
import type { Disposable } from '@/core/dispose';
import type RenderContext from '@/pipeline/context';

/**
 * 可编程渲染管线
 *
 * 可以在管线中自定义渲染流程, 类似于Unity的SRP
 *
 * @example
 * ```typescript
 * class MyPipeline extends ScriptablePipeline {
 *   constructor() {
 *      super();
 *      // some initialization
 *   }
 *
 *   render(context: RenderContext, cameras: Camera[]) {
 *     // render logic
 *     context.submit();
 *   }
 *  }
 *  ```
 */
export abstract class ScriptablePipeline implements Disposable {
  abstract render(context: RenderContext, cameras: Camera[]): void;

  abstract dispose(): void;
}
