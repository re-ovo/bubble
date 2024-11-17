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
let camera = new Entity('Camera')
let cameraComponent = camera.addComponent(CameraComponent)
cameraComponent.camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
)

let cubeEntity = new Entity('Cube')
let mr = cubeEntity.addComponent(MeshRendererComponent)
mr.mesh = createCubeMesh()
mr.material = new StandardMaterial()

const draw = () => {
    engine.render(scene, cameraComponent.camera!)
    requestAnimationFrame(draw);
}

draw()
