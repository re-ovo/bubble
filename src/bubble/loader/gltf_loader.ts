import {GLTFLoader, type GLTFPostprocessed, postProcessGLTF} from '@loaders.gl/gltf';
import {load} from "@loaders.gl/core";
import {Entity} from "@/bubble/core/system";
import {MeshRendererComponent} from "@/bubble/node/renderer/mesh_renderer";
import {Mesh} from "@/bubble/node/mesh/mesh";
import {BufferAttribute} from "@/bubble/resource/primitive/attribute";
import {StandardMaterial} from "@/bubble/node/material/standard_material";
import colors from "@/bubble/math/colors";
import {mat3, mat4, quat} from "wgpu-matrix";
import {Texture2D} from "@/bubble/resource/primitive/texture";

export async function loadGltfModel(url: string) {
    const gltf = await load(url, GLTFLoader)
    const gltfPostProcessed = postProcessGLTF(gltf)
    console.log(gltfPostProcessed)
    return await convertToEntities(gltfPostProcessed)
}

export async function loadGltfExample(modelName: string) {
    return await loadGltfModel(`https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/${modelName}/glTF/${modelName}.gltf`)
}

async function convertToEntities(gltf: GLTFPostprocessed): Promise<Entity[]> {
    const entities: Entity[] = []

    for (const node of gltf.nodes) {
        const mesh = node.mesh
        if (!mesh) {
            continue
        }
        for (const primitive of mesh.primitives) {
            // console.log(primitive)
            const entity = new Entity()

            if (node.matrix) {
                // matrix = T * R * S (column-major)
                // T = translation
                // R = rotation
                // S = scale
                const mat = mat4.create(
                    node.matrix[0], node.matrix[4], node.matrix[8], node.matrix[12],
                    node.matrix[1], node.matrix[5], node.matrix[9], node.matrix[13],
                    node.matrix[2], node.matrix[6], node.matrix[10], node.matrix[14],
                    node.matrix[3], node.matrix[7], node.matrix[11], node.matrix[15],
                )
                const translation = mat4.getTranslation(mat)
                const scaling = mat4.getScaling(mat)
                const rotation = quat.fromMat(mat3.fromMat4(mat))
                console.log('translation', translation)
                console.log('scaling', scaling)
                console.log('rotation', rotation)
            }

            const renderer = entity.addComponent(MeshRendererComponent)

            const mesh = new Mesh()
            mesh.addAttribute('position', new BufferAttribute(
                primitive.attributes['POSITION'].value,
                3
            ))
            mesh.addAttribute('normal', new BufferAttribute(
                primitive.attributes['NORMAL'].value,
                3
            ))
            mesh.addAttribute('uv', new BufferAttribute(
                primitive.attributes['TEXCOORD_0'].value,
                2
            ))
            if (primitive.indices) {
                const uint16Array = new Uint16Array(primitive.indices.value)
                mesh.setIndices(uint16Array)
            }
            renderer.mesh = mesh

            const material = new StandardMaterial()
            material.color = colors.newColor4fFromHex('#00bb00')
            renderer.material = material
            if (primitive.material && primitive.material.pbrMetallicRoughness) {
                material.roughness = primitive.material.pbrMetallicRoughness.roughnessFactor || 1.0
                material.metallic = primitive.material.pbrMetallicRoughness.metallicFactor || 1.0
                if (primitive.material.pbrMetallicRoughness.baseColorTexture) {

                    const imageBitmap = await createImageBitmap(
                        new Blob(
                            [primitive.material.pbrMetallicRoughness.baseColorTexture.texture.source!.bufferView!.data],
                            {type: primitive.material.pbrMetallicRoughness.baseColorTexture.texture.source?.mimeType}
                        ), {
                            colorSpaceConversion: 'none'
                        }
                    )

                    material.addTexture('baseColorTexture', new Texture2D(
                        imageBitmap,
                        primitive.material.pbrMetallicRoughness.baseColorTexture.texture.source!.image.width!,
                        primitive.material.pbrMetallicRoughness.baseColorTexture.texture.source!.image.height!
                    ))
                }
            }

            entities.push(entity)
        }
    }

    return entities
}
