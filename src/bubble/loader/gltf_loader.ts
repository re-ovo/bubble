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
import {mat4, quat, vec3} from "wgpu-matrix";
import {Texture, Texture2D} from "@/bubble/resource/primitive/texture";
import {convertUint8ArrayToImageBitmap, createImageBitmapOfColor} from "@/bubble/loader/texture_loader";
import NProgress from "nprogress";
import {MaterialBlendMode} from "@/bubble/node/material/material";

/**
 * 从 glTF 示例仓库加载模型
 *
 * @param modelName 模型名称
 * @param onEntityLoaded 每个实体加载完成后的回调，用于渐进式加载
 */
export async function loadGltfExample(modelName: string, onEntityLoaded: (entity: Entity) => void) {
    return await loadGltfModel(`https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/${modelName}/glTF/${modelName}.gltf`, onEntityLoaded)
}

/**
 * 从 glTF 文件加载模型
 *
 * @param url glTF 文件的 URL
 * @param onEntityLoaded 每个实体加载完成后的回调，用于渐进式加载
 */
export async function loadGltfModel(
    url: string,
    onEntityLoaded: (entity: Entity) => void = () => {
    }
) {
    try {
        const gltf = await load(url, GLTFLoader)
        console.log('Loaded gltf model, post processing...')
        console.log('Extensions Required:', gltf.json.extensionsRequired)
        console.log('Extensions Used:', gltf.json.extensionsUsed)
        console.log('GLTF Version:', gltf.json.asset.version)
        console.log('Nodes:', gltf.json.nodes)
        console.log('Meshes:', gltf.json.meshes)
        const gltfPostProcessed = postProcessGLTF(gltf)
        return await convertToEntities(gltfPostProcessed, onEntityLoaded)
    } catch (e) {
        console.error('Failed to load gltf model', e)
    } finally {
        NProgress.done()
    }
    return []
}

// 将 glTF 转换为Entities
async function convertToEntities(gltf: GLTFPostprocessed, onEntityLoaded: (entity: Entity) => void): Promise<Entity[]> {
    const entities: Entity[] = []
    const nodeEntities: Map<GLTFNodePostprocessed, Entity> = new Map()
    const textureCache: Map<number, Texture> = new Map()

    for (const node of gltf.nodes) {
        // Node Self
        const nodeEntity = new Entity()
        const nodeTransform = nodeEntity.getComponent(Transform)!
        if (node.matrix) {
            const matrix4 = mat4.create(...node.matrix)
            nodeTransform.setByMatrix(matrix4)
            nodeTransform.updateMatrix()
            if (!mat4.equalsApproximately(matrix4, nodeTransform.localTransformMatrix)) {
                console.warn('Matrix not equal', matrix4, nodeTransform.localTransformMatrix)
            }
        } else {
            if (node.translation) nodeTransform.setPosition(vec3.create(node.translation[0], node.translation[1], node.translation[2]))
            if (node.rotation) nodeTransform.setRotation(quat.create(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3]))
            if (node.scale) nodeTransform.setScale(vec3.create(node.scale[0], node.scale[1], node.scale[2]))
        }
        entities.push(nodeEntity)
        nodeEntities.set(node, nodeEntity)

        // Node Primitives
        if (node.mesh) {
            const primitives: Entity[] = []
            for (const primitive of node.mesh.primitives) {
                await convertPrimitive(
                    primitive,
                    primitives,
                    textureCache,
                    onEntityLoaded
                );
            }
            primitives.forEach(primitive => {
                primitive.setParent(nodeEntity)
            })
            entities.push(...primitives)
        }
    }

    // Node Hierarchy
    for (const rawNode of gltf.nodes) {
        if (rawNode.children && rawNode.children.length > 0) {
            const nodeEntity = nodeEntities.get(rawNode)
            if (!nodeEntity) {
                throw new Error('Node entity not found')
            }
            for (const child of rawNode.children) {
                const childEntity = nodeEntities.get(child)!
                if (childEntity.parent) throw new Error('Child entity already has parent')
                childEntity.setParent(nodeEntity)
            }
        }
    }

    console.log('Loaded', entities.length, 'entities')

    return entities
}

const defaultAlbedo = new Texture2D(
    createImageBitmapOfColor(1, 1, '#ffffff'),
    1,
    1,
    GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
)
const defaultNormal = new Texture2D(
    createImageBitmapOfColor(1, 1, '#8080ff'),
    1,
    1,
    GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
)
const defaultPBR = new Texture2D(
    createImageBitmapOfColor(1, 1, '#ffffff'),
    1,
    1,
    GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
)

async function convertPrimitive(
    primitive: GLTFMeshPrimitivePostprocessed,
    entities: Entity[],
    textureCache: Map<number, Texture>,
    onEntityLoaded: (entity: Entity) => void
) {
    const entity = new Entity()

    const renderer = entity.addComponent(MeshRendererComponent)

    // Mesh
    const mesh = new Mesh()
    const positionAttribute = primitive.attributes['POSITION']
    if (positionAttribute.type !== 'VEC3') throw new Error('Position attribute is not VEC3')
    mesh.addAttribute('position', new BufferAttribute(
        positionAttribute.value,
        3
    ))
    if (primitive.attributes['NORMAL'].type !== 'VEC3') throw new Error('Normal attribute is not VEC3')
    mesh.addAttribute('normal', new BufferAttribute(
        primitive.attributes['NORMAL'].value,
        3
    ))
    if (primitive.attributes['TEXCOORD_0'].type !== 'VEC2') throw new Error('UV attribute is not VEC2')
    mesh.addAttribute('uv', new BufferAttribute(
        primitive.attributes['TEXCOORD_0'].value,
        2
    ))
    if (primitive.indices) {
        if (primitive.indices.type !== 'SCALAR') throw new Error('Indices attribute is not SCALAR')
        const uint16Array = new Uint16Array(primitive.indices.value)
        mesh.setIndices(uint16Array)
        // if(mesh.drawCount !== primitive.indices.count) throw new Error('Draw count is not equal to indices count')
        mesh.setVertexCount(primitive.indices.count)
    } else {
        console.log('No indices found for primitive', primitive)
    }
    renderer.mesh = mesh

    // Material
    const material = new StandardMaterial()
    renderer.material = material

    // Material Properties
    const baseColorFactor = primitive.material?.pbrMetallicRoughness?.baseColorFactor
    material.color = baseColorFactor ? colors.newColor4f(
        baseColorFactor[0],
        baseColorFactor[1],
        baseColorFactor[2],
        baseColorFactor[3]
    ) : colors.White
    material.roughness = primitive.material?.pbrMetallicRoughness?.roughnessFactor ?? 1.0
    material.metallic = primitive.material?.pbrMetallicRoughness?.metallicFactor ?? 1.0
    material.blendMode = BlendModeMapping[primitive.material?.alphaMode ?? 'OPAQUE']

    // Textures
    if (primitive.material && primitive.material.pbrMetallicRoughness) {
        // PBR Albedo
        if (primitive.material.pbrMetallicRoughness.baseColorTexture) {
            const coord = primitive.material.pbrMetallicRoughness.baseColorTexture.texCoord
            if (coord !== undefined) {
                throw new Error('Texture coord is not supported yet')
            }
            const texture = await loadTexture(primitive.material.pbrMetallicRoughness.baseColorTexture, textureCache)
            material.addTexture('baseColorTexture', texture)
        }
        // PBR Metallic Roughness
        if (primitive.material.pbrMetallicRoughness.metallicRoughnessTexture) {
            const texture = await loadTexture(primitive.material.pbrMetallicRoughness.metallicRoughnessTexture, textureCache)
            material.addTexture('pbrTexture', texture)
        }
    }
    if (primitive.material && primitive.material.normalTexture) {
        const texture = await loadTexture(primitive.material.normalTexture, textureCache)
        material.addTexture('normalTexture', texture)
    }
    if (!material.hasTexture('baseColorTexture')) {
        material.addTexture('baseColorTexture', defaultAlbedo)
    }
    if (!material.hasTexture('normalTexture')) {
        material.addTexture('normalTexture', defaultNormal)
    }
    if (!material.hasTexture('pbrTexture')) {
        material.addTexture('pbrTexture', defaultPBR)
    }

    entities.push(entity)
    onEntityLoaded(entity)
}

async function loadTexture(
    info: { index?: number, texture: any },
    textureCache: Map<number, Texture>
): Promise<Texture> {
    if (info.index !== undefined && textureCache.has(info.index)) {
        return textureCache.get(info.index)!
    }
    if (info.texture.source === undefined) {
        throw new Error('Texture source is undefined')
    }
    let data = info.texture.source!.bufferView!.data
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

    texture.minFilter = FilterValueMapping[info.texture.sampler.minFilter] ?? 'linear'
    texture.magFilter = FilterValueMapping[info.texture.sampler.magFilter] ?? 'linear'
    texture.addressModeU = WrapValueMapping[info.texture.sampler.wrapS] ?? 'repeat'
    texture.addressModeV = WrapValueMapping[info.texture.sampler.wrapT] ?? 'repeat'

    if (info.index !== undefined) {
        textureCache.set(info.index, texture)
    }
    return texture
}

const FilterValueMapping: Record<number, GPUFilterMode> = {
    9728: 'nearest', // NEAREST
    9729: 'linear', // LINEAR
    9984: 'nearest', // NEAREST_MIPMAP_NEAREST
    9985: 'linear', // LINEAR_MIPMAP_NEAREST
    9986: 'nearest', // NEAREST_MIPMAP_LINEAR
    9987: 'linear' // LINEAR_MIPMAP_LINEAR
}

const WrapValueMapping: Record<number, GPUAddressMode> = {
    33071: 'clamp-to-edge', // CLAMP_TO_EDGE
    33648: 'mirror-repeat', // MIRRORED_REPEAT
    10497: 'repeat' // REPEAT
}

const BlendModeMapping: Record<string, MaterialBlendMode> = {
    'OPAQUE': MaterialBlendMode.OPAQUE,
    'MASK': MaterialBlendMode.MASK,
    'BLEND': MaterialBlendMode.BLEND
}
