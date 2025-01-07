#define_import_path bubble::tonemapping::gamma

const GAMMA = 2.2;

fn gamma_correct(linear_color: vec3<f32>) -> vec3<f32> {
    return pow(linear_color, vec3<f32>(1.0 / GAMMA));
}

fn gamma_inverse(gamma_color: vec3<f32>) -> vec3<f32> {
    return pow(gamma_color, vec3<f32>(GAMMA));
}
