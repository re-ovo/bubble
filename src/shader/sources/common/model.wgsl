#define_import_path bubble::common::model

struct ModelInfo {
    modelMatrix: mat4x4<f32>,
    modelMatrixInverse: mat4x4<f32>,
}

@group(1) @binding(auto) var<uniform> modelInfo: ModelInfo;
