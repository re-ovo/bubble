# bubble
一个基于WebGPU的渲染引擎

## 功能
WIP... 

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
    - `shader`: 着色器定义和处理，遵循[WebGPU着色器最佳实践](https://toji.dev/webgpu-best-practices/dynamic-shader-construction)
    - `node`: 场景中各种元素(例如Mesh, Material, Light...)的实现
    - `math`: 一些数学工具类
    - `loader`: 资源/模型加载器
    - `helper`: 一些辅助实现 (如Controller以及一些VisualHelper)
    - `spec`: 基于Vitest的测试用例

## 常用开发参考
- [Tweakpane](https://tweakpane.github.io/docs/getting-started/): 数据驱动的UI，方便调试
- [TypeGPU](https://docs.swmansion.com/TypeGPU/guides/getting-started/)：基于TypeScript的WebGPU资源管理库
