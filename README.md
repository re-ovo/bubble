# bubble

一个基于WebGPU的渲染引擎, 参考了Unity的Component和SRP设计。

> 仍然在开发中，没有实际渲染功能

## 功能

- [ ] 内置集群前向渲染管线 (Clustered Forward Rendering)
- [x] 类Unity Component组件系统 (Entity/Component)
- [x] 可编程渲染管线 (SRP)
- [ ] 基于Radiance Cascades的实时全局光照 (Realtime GI)
- [ ] 动画系统 (Animation)
- [x] PBR (Cook-Torrance BRDF)
- [ ] 剔除 (Culling)
- [ ] 阴影 (ShadowMap/Cascaded ShadowMap)
- [ ] 灯光 (Point/Spot/Directional/Ambient Light)
- [ ] 雾/体积雾 (Volumetric Fog)
- [ ] 天空盒 (Skybox)
- [ ] CubeMap IBL
- [ ] PostProcessing (Bloom)
- [ ] SSAO
- [ ] 物理模拟 (Physics)

## 性能对比

TODO

## 使用

```shell
# 克隆项目
git clone

# 安装依赖
npm install # 安装项目依赖
npx playwright install # 安装浏览器驱动用于单元测试

# 运行
npm run dev

# 测试
npm run test:unit
```

## 项目结构

- `bubble`: 渲染引擎
  - `core`: 定义一些核心的接口和类
  - `pipeline`: 类Unity的可编程渲染管线和渲染图
  - `shader`:
    着色器定义和处理，遵循[WebGPU着色器最佳实践](https://toji.dev/webgpu-best-practices/dynamic-shader-construction)
  - `node`: 场景中各种元素(例如Mesh, Material, Light...)的实现
  - `math`: 一些数学工具类
  - `loader`: 资源/模型加载器
  - `helper`: 一些辅助实现 (如Controller以及一些VisualHelper)
  - `spec`: 基于Vitest的测试用例

## Shader

Shader编写遵循[WebGPU着色器最佳实践](https://toji.dev/webgpu-best-practices/dynamic-shader-construction),
使用JavaScript字符串
模板来动态生成Shader代码。

```typescript
const shader = wgsl`
struct VertexInput {
  @location(0) position: vec3<f32>;
  @location(1) normal: vec3<f32>;
  @location(2) uv: vec2<f32>;
};

@vertex
fn vs(input: VertexInput) -> @builtin(position) vec4<f32> {
  #if ${表达式}
    return vec4<f32>(input.position, 1.0);
  #else
    return vec4<f32>(input.position, 1.0);
  #endif
}`;
```

## 三方库

- [Tweakpane](https://tweakpane.github.io/docs/getting-started/): 数据驱动的UI，方便调试
- [wgsl_reflect](https://github.com/brendan-duncan/wgsl_reflect): WGSL反射库，用于解析wgsl绑定信息用于绑定资源
