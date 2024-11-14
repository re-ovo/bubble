/**
 * 绑定组ID
 *
 * 基于绑定频率进行分组，以便于在渲染时进行优化
 *
 * 参考:
 * https://toji.dev/webgpu-best-practices/bind-groups
 */
export enum BindGroupId {
    /**
     * 0绑定组为最低变化频率的绑定组，通常用于存储相机信息，它只会在
     * 每个pass开始时更新一次
     */
    PASS = 0,
    /**
     * 1绑定组为不频繁变化的绑定组，通常用于存储材质信息，例如Uniform, Texture等
     */
    MATERIAL = 1,
    /**
     * 2绑定组为频繁变化的绑定组，通常用于存储模型信息，例如模型矩阵等
     */
    MODEL = 2,
}
