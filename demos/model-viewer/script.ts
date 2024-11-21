import {
    CameraComponent,
    createCubeMesh,
    Entity,
    MeshRendererComponent,
    PerspectiveCamera,
    RenderEngine,
    Scene, StandardMaterial
} from "@bubblejs/bubble";
import {Pane} from "tweakpane";
import {lookupModels} from "../panel";
import {vec3} from "wgpu-matrix";
import {FPSController} from "@/helper/controller";

const canvasRef = document.querySelector('#canvas') as HTMLCanvasElement;
canvasRef.width = canvasRef.clientWidth;
canvasRef.height = canvasRef.clientHeight;

const engine = new RenderEngine();
await engine.init(canvasRef, {
    // pipelineProvider() {
    //     return new ForwardPlusPipeline()
    // },
});
const pane = new Pane();

let scene = new Scene()

lookupModels(pane, scene);

let cameraEntity = new Entity('Camera')
let cameraComponent = cameraEntity.addComponent(CameraComponent)
cameraComponent.camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
)
cameraEntity.transform.localPosition = vec3.create(0, 0, 5)
cameraEntity.addComponent(FPSController).init(canvasRef)
scene.addChild(cameraEntity)

let cubeEntity = new Entity('Cube')
let mr = cubeEntity.addComponent(MeshRendererComponent)
mr.mesh = createCubeMesh()
mr.material = new StandardMaterial()

const draw = () => {
    engine.render(scene, cameraComponent.camera!)
    requestAnimationFrame(draw);
}

draw()
