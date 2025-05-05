import { ShaderComponent } from "./shader-component.js";

const fragmentShader = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
out vec4 fragColor;

// https://www.shadertoy.com/view/ctyyz1 random lozenge tiling, 2023 by jt
// based on https://www.shadertoy.com/view/cdcyRH hexagonally grouped triangles

// https://www.shadertoy.com/view/WttXWX "Best" Integer Hash by FabriceNeyret2,
// implementing Chris Wellons https://nullprogram.com/blog/2018/07/31/
int triple32(int x)
{
    x ^= x >> 17;
    x *= 0xed5ad4bb;
    x ^= x >> 11;
    x *= 0xac4c1b51;
    x ^= x >> 15;
    x *= 0x31848bab;
    x ^= x >> 14;
    return x;
}

#define HASH(u) triple32(u)

int hash(ivec3 v)
{
    return HASH(v.x + HASH(v.y + HASH(v.z + int(floor(iTime)))));
}

vec3 triangular(vec2 p) // via 3x3 matrix
{
    // essential 2x3 matrix (to triangular, with additional 90 degree rotation)
    return mat2x3(normalize(vec3(-1,-1,+2)),normalize(vec3(+1,-1, 0)))*p;
}

// https://www.shadertoy.com/view/DtjyWD integer division - rounding down
ivec3 div_floor(ivec3 a, int b) // vector version thanks to Fabrice
{
    ivec3 S = (sign(abs(a*b))-sign(a*b))/2; // 0 if a*b >= 0
    return S * ((1 - abs(a)) / abs(b) - 1)+(1-S)*(a / b); // emulates ()?:
}

ivec3 mod_positive(ivec3 a, int b)
{
    return a - div_floor(a, b) * b;
}

ivec3 hexagonal(ivec3 i) // group triangular coordinates to hexagonal coordinates (jt)
{
    return div_floor(i.zxy-i.yzx,3);
}

void main() {
    vec2 p = gl_FragCoord.xy;
    vec2 R = iResolution.xy;
    p = (2.0 * p - R) / R.y; // unit coordinates (keeping aspect ratio)
    p *= 4.0*sqrt(6.0); // scale
    vec3 b = triangular(p); // convert to barycentric coordinates
    ivec3 t = ivec3(floor(b)); // quantize to triangle indices
    ivec3 h = hexagonal(t); // group triangles to hexagons
    fragColor = vec4(equal(mod_positive(t.xyz-t.yzx,3),ivec3(1&hash(h))),1); // color-code lozenges / cube-sides (jt)
}`;

class LozengShader extends ShaderComponent {
  constructor() {
    super();
    this.setFragmentShader(fragmentShader);
  }
}

customElements.define("lozeng-shader", LozengShader);
