#define_import_path bubble::common::camera

struct CameraInput {
    projectionMatrix: mat4x4<f32>,
    viewMatrixInverse: mat4x4<f32>,
    cameraPosition: vec3<f32>,
}