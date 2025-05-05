import { ShaderComponent } from "./shader-component.js";

const fragmentShader = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
out vec4 fragColor;

const float PI = 3.1419265358;

vec2 get_uv(vec2 uv) {
    float t = iTime * 0.7;
    float a = 4.0 * uv.y - sin(uv.x * 3.0 + uv.y - t);
    a = smoothstep(cos(a) * 0.7, sin(a) * 0.7 + 1.0, cos(a - 4.0 * uv.y) - sin(a - 3.0 * uv.x)); // mask
    uv = cos(a) * uv + sin(a) * vec2(-uv.y, uv.x); // rotate
    return uv;
}

const vec3 purple = vec3(0.68, 0.1, 0.9);
const vec3 blue = vec3(0.6, 0.8, 0.94);
const vec3 orange = vec3(1, 0.68, 0.4);
const vec3 red = vec3(0.98, 0.38, 0.35);

vec4 get_col(vec2 uv) {
    uv = get_uv(uv) * 0.5 + 0.5;
    vec3 col = mix(purple, orange, uv.x);
    col = mix(col, blue, uv.y);
    col *= col + 0.5 * sqrt(col);
    return vec4(col, dot(col, vec3(0.3, 0.6, 0.1)));
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / (iResolution.x + iResolution.y) * 2.0;
    
    vec4 col = get_col(uv);
    //col.rgb = traces(uv, col);
    
    fragColor = vec4(col.rgb, 1);
}`;

class FlowShader extends ShaderComponent {
  constructor() {
    super();
    this.setFragmentShader(fragmentShader);
  }
}

customElements.define("flow-shader", FlowShader);
