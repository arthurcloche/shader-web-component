import { ShaderComponent } from "./shader-component.js";

const fragmentShader = `#version 300 es
precision highp float;
#define PI 3.14159265359
#define WAVES 8.
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
out vec4 fragColor;

float wavePosition(vec2 uv, float i) {
    return sin((uv.x + i * 8.456) * (sin(iTime * 0.1 + 7.539 + i * 0.139) + 2.) * 0.5) * 0.65
        + sin(uv.x * (sin(iTime * 0.1 + i * 0.2) + 2.) * 0.3) * 0.3
        - (i - WAVES / 2.) * 2. - uv.y;
}
vec3 colorPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(PI * 2. * (c * t + d));
}
vec3 color(float x) {
    return colorPalette(x, vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(2., 1., 0.), vec3(0.5, 0.2, 0.25));
}
void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = fragCoord / iResolution.xy;
    vec2 waveUv = (2. * fragCoord - iResolution.xy) / iResolution.y * (WAVES - 1.);
    float aa = WAVES * 2. / iResolution.y;
    vec4 outColor = vec4(0.0);
    for (float i = 0.; i < WAVES; i++) {
        float waveTop = wavePosition(waveUv, i);
        float waveBottom = wavePosition(waveUv, i + 1.);
        vec3 col = color(i * 0.12 + uv.x * 0.2 + iTime * 0.02);
        col += smoothstep(0.3, 0., waveTop) * 0.05;
        col += (1. - abs(0.5 - smoothstep(waveTop, waveBottom, 0.))) * 0.06;
        col += smoothstep(-0.3, 0., waveBottom) * -0.05;
        outColor.xyz = mix(outColor.xyz, col, smoothstep(0., aa, waveTop));
    }
    outColor.w = 1.;
    fragColor = outColor;
}`;

class SimplewavesShader extends ShaderComponent {
  constructor() {
    super();
    this.setFragmentShader(fragmentShader);
  }
}
customElements.define("simplewaves-shader", SimplewavesShader);
