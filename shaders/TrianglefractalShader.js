import { ShaderComponent } from "./shader-component.js";

const fragmentShader = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
out vec4 fragColor;

float rand(vec2 co)
{
    return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
}

float GetLocation(vec2 s, float d)
{
    vec2 f = s*d;

    // tris
    f = mod(f, 8.); // because i failed somewhere
    
    f = f + vec2(0,0.5)*floor(f).x;
    s = fract(f);
    f = floor(f);

    float d2 = s.y - 0.5;
    float l = abs(d2) + 0.5 * s.x;
    float ff = f.x+f.y;
    f = mix(f, f+sign(d2)*vec2(0,0.5), step(0.5, l));
    l = mix(ff, ff+sign(d2)*0.5, step(0.5, l));

    return l * rand(vec2(f));
}

vec3 hsv2rgb(float h, float s, float v)
{
    h = fract(h);
    vec3 c = smoothstep(2./6., 1./6., abs(h - vec3(0.5, 2./6., 4./6.)));
    c.r = 1.-c.r;
    return mix(vec3(s), vec3(1.0), c) * v;
}

vec3 getRandomColor(float f, float t)
{
    return hsv2rgb(f+t, 0.2+cos(sin(f))*0.3, 0.9);
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    float mx = max(iResolution.x, iResolution.y);
    float t = iTime*0.3;
    vec2 s = fragCoord.xy / mx + vec2(t, 0) * 0.2;

    float f[3];
    f[0] = GetLocation(s, 12.);
    f[1] = GetLocation(s, 6.);
    f[2] = GetLocation(s, 3.);

    vec3 color = getRandomColor(f[1] *0.05 + 0.01*f[0] + 0.9*f[2], t);

    fragColor = vec4(color, 1.);
}`;

class TrianglefractalShader extends ShaderComponent {
  constructor() {
    super();
    this.setFragmentShader(fragmentShader);
  }
}

customElements.define("trianglefractal-shader", TrianglefractalShader);
