import {wgsl} from "@/bubble/shader/lang";
import {expect, test} from "vitest";

test("wgsl", () => {
    let condition = false;

    const shader = () => wgsl`
    // just test for if
    #if ${condition}
        let a = 1;
    #else
        let a = 2;   
    #endif 
    `

    condition = false;
    expect(shader()).contains("let a = 2;").and.not.contains("let a = 1;");

    condition = true;
    expect(shader()).contains("let a = 1;").and.not.contains("let a = 2;");
})
