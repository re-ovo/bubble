import {Entity} from "@bubblejs/bubble";
import {Pane} from "tweakpane";

const entity = new Entity('???')
console.log(entity)

const pane = new Pane();
pane.addButton({
    title: 'Click me',
}).on('click', () => {
    console.log('Button clicked');
})
