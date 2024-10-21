import {
    GLTFLoader,
    type GLTFMeshPrimitivePostprocessed,
    type GLTFNodePostprocessed,
    type GLTFPostprocessed,
    postProcessGLTF
} from '@loaders.gl/gltf';
import {load} from "@loaders.gl/core";
import {Entity, Transform} from "@/bubble/core/system";
import {MeshRendererComponent} from "@/bubble/node/renderer/mesh_renderer";
import {Mesh} from "@/bubble/node/mesh/mesh";
import {BufferAttribute} from "@/bubble/resource/primitive/attribute";
import {StandardMaterial} from "@/bubble/node/material/standard_material";
import colors from "@/bubble/math/colors";
import {mat3, mat4, quat, vec3} from "wgpu-matrix";
import {Texture, Texture2D} from "@/bubble/resource/primitive/texture";
import {convertUint8ArrayToImageBitmap, createImageBitmapOfColor} from "@/bubble/loader/texture_loader";
import NProgress from "nprogress";

export async function loadGltfModel(url: string) {
    try {
        const gltf = await load(url, GLTFLoader)
        const gltfPostProcessed = postProcessGLTF(gltf)
        return await convertToEntities(gltfPostProcessed)
    } catch (e) {
        console.error('Failed to load gltf model', e)
    } finally {
        NProgress.done()
    }
    return []
}

export async function loadGltfExample(modelName: string) {
    return await loadGltfModel(`https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/${modelName}/glTF/${modelName}.gltf`)
}

async function convertToEntities(gltf: GLTFPostprocessed): Promise<Entity[]> {
    const entities: Entity[] = []
    const textureCache : Map<number, Texture> = new Map()
    const nodes = gltf.nodes.length


    for (const [index, node] of gltf.nodes.entries()) {
        const mesh = node.mesh
        if (!mesh) {
            continue
        }
        for (const primitive of mesh.primitives) {
            await convertPrimitive(
                node,
                primitive,
                entities,
                textureCache
            );
            await new Promise(resolve => setTimeout(resolve, 0))
        }

        NProgress.set(index / nodes - 1)
    }

    console.log('Loaded', entities.length, 'entities')

    return entities
}

async function convertPrimitive(
    node: GLTFNodePostprocessed,
    primitive: GLTFMeshPrimitivePostprocessed,
    entities: Entity[],
    textureCache: Map<number, Texture>
) {
    const entity = new Entity()

    const transform = entity.getComponent(Transform)!
    if(node.translation) {
        transform.setPosition(vec3.create(node.translation[0], node.translation[1], node.translation[2]))
    }
    if(node.rotation){
        transform.setRotationByQuaternion(quat.create(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3]))
    }
    if(node.scale) {
        transform.setScale(vec3.create(node.scale[0], node.scale[1], node.scale[2]))
    }

    if (node.matrix) {
        const mat = mat4.create(
            node.matrix[0], node.matrix[4], node.matrix[8], node.matrix[12],
            node.matrix[1], node.matrix[5], node.matrix[9], node.matrix[13],
            node.matrix[2], node.matrix[6], node.matrix[10], node.matrix[14],
            node.matrix[3], node.matrix[7], node.matrix[11], node.matrix[15],
        )
        const translation = mat4.getTranslation(mat)
        const scaling = mat4.getScaling(mat)
        const rotation = quat.fromMat(mat3.fromMat4(mat))
        throw new Error('Matrix transformation is not supported')
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

    material.roughness = primitive.material?.pbrMetallicRoughness?.roughnessFactor ?? 1.0
    material.metallic = primitive.material?.pbrMetallicRoughness?.metallicFactor ?? 1.0
    if (primitive.material && primitive.material.pbrMetallicRoughness) {
        if (primitive.material.pbrMetallicRoughness.baseColorTexture) {
            const coord = primitive.material.pbrMetallicRoughness.baseColorTexture.texCoord
            if(coord !== undefined) {
                throw new Error('Texture coord is not supported yet')
            }

            const texture = await loadTexture(primitive.material.pbrMetallicRoughness.baseColorTexture, textureCache)
            material.addTexture('baseColorTexture', texture)
        }
    }
    if (primitive.material && primitive.material.normalTexture) {
        const texture = await loadTexture(primitive.material.normalTexture, textureCache)
        material.addTexture('normalTexture', texture)
    }
    if (!material.hasTexture('baseColorTexture')) {
        const imageBitmap = await createImageBitmapOfColor(1, 1, '#ffffff')
        material.addTexture('baseColorTexture', new Texture2D(
            imageBitmap,
            1,
            1
        ))
        console.log('created default base color texture for', primitive)
    }
    if (!material.hasTexture('normalTexture')) {
        const imageBitmap = await createImageBitmapOfColor(1, 1, '#8080ff')
        material.addTexture('normalTexture', new Texture2D(
            imageBitmap,
            1,
            1
        ))
        console.log('created default normal texture for', primitive)
    }

    entities.push(entity)
}

async function loadTexture(
    info: { index?: number, texture: any },
    textureCache: Map<number, Texture>
): Promise<Texture> {
    if (info.index !== undefined && textureCache.has(info.index)) {
        return textureCache.get(info.index)!
    }
    if(info.texture.source === undefined) {
        throw new Error('Texture source is undefined')
    }

    const byteOffset = info.texture.source!.bufferView!.byteOffset
    const byteLength = info.texture.source!.bufferView!.byteLength
    let data = info.texture.source!.bufferView!.data
    if (byteOffset && byteLength) {
        data = new Uint8Array(data.buffer, byteOffset, byteLength)
    }
    const imageBitmap = await convertUint8ArrayToImageBitmap(
        data,
        info.texture.source!.image.width!,
        info.texture.source!.image.height!,
        info.texture.source!.mimeType
    )
    const texture = new Texture2D(
        imageBitmap,
        info.texture.source!.image.width!,
        info.texture.source!.image.height!,
    )
    if (info.index !== undefined) {
        textureCache.set(info.index, texture)
    }
    return texture
}
