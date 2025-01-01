import { wgsl } from '@/utils/processor';
import { autoBinding } from '@/utils/binding_counter';
import { BindGroupId } from '@/shader/groups';

export default () => wgsl`
struct ModelInfo {
    modelMatrix: mat4x4<f32>,
    modelMatrixInverse: mat4x4<f32>,
}

${autoBinding(BindGroupId.MODEL)} var<uniform> modelInfo: ModelInfo;
`;
