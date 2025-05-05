import { ShaderComponent } from "./shader-component.js";

const fragmentShader = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
out vec4 fragColor;

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 p = (2.0 * fragCoord - iResolution) / min(iResolution.x, iResolution.y);
    
    float tau = 3.1415926535 * 2.0;
    float a = atan(p.y, p.x);
    float r = length(p) * 0.75;
    
    vec2 uv = vec2(a / tau, r);
    
    // Time varying pixel color
    float xCol = (uv.x - (iTime / 3.0)) * 3.0;
    xCol = mod(xCol, 3.0);
    vec3 horColour = vec3(0.25, 0.25, 0.25);
    
    if (xCol < 1.0) {
        horColour.r += 1.0 - xCol;
        horColour.g += xCol;
    }
    else if (xCol < 2.0) {
        xCol -= 1.0;
        horColour.g += 1.0 - xCol;
        horColour.b += xCol;
    }
    else {
        xCol -= 2.0;
        horColour.b += 1.0 - xCol;
        horColour.r += xCol;
    }
    
    // Circle
    float yCol = mod(uv.y + iTime / 10.0, 0.5) * 2.0;
    if (yCol < 1.0) {
        horColour *= yCol;
    }
    
    // Mouse interaction
    vec2 mousePos = iMouse.xy / iResolution.xy;
    float mouseDist = length(p - vec2(mousePos * 2.0 - 1.0)) * 2.0;
    horColour *= 1.0 - (0.25 / mouseDist);
    
    fragColor = vec4(horColour, 1.0);
}`;

class CirclesShader extends ShaderComponent {
  constructor() {
    super();
    this.setFragmentShader(fragmentShader);
  }
}

customElements.define("circles-shader", CirclesShader);
