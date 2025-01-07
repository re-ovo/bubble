#define_import_path bubble::common::converts

fn mat4fToMat3f(mat4f: mat4x4<f32>) -> mat3x3<f32> {
    return mat3x3<f32>(mat4f[0].xyz, mat4f[1].xyz, mat4f[2].xyz);
}
