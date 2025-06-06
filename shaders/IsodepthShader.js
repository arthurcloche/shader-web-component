import { ShaderComponent } from "./shader-component.js";

const fragmentShader = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
out vec4 fragColor;

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) { 
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

  // Permutations
  i = mod289(i); 
  vec4 p = permute(permute(permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0)) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Gradients: 7x7 points over a square, mapped onto an octahedron.
  // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  //Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), 
                               dot(p2,x2), dot(p3,x3)));
}

const float STEPS = 16.;
const float CUTOFF = 0.25; //depth less than this, show white wall
const vec2 OFFSET = vec2(0.004,0.004); //drop shadow offset

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float getNoise(vec2 uv, float t) {
    //given a uv coord and time - return a noise val in range 0 - 1
    //using ashima noise
    
    //octave 1
    float SCALE = 2.0;
    float noise = snoise(vec3(uv.x*SCALE, uv.y*SCALE, t));
    
    //octave 2 - more detail
    SCALE = 6.0;
    noise += snoise(vec3(uv.x*SCALE + t, uv.y*SCALE, 0)) * 0.2;
    
    //move noise into 0 - 1 range    
    noise = (noise/2. + 0.5);
    
    return noise;
}

float getDepth(float n) {
    //given a 0-1 value return a depth,
    //e.g. distance into the hole
    
    //remap remaining non-cutoff region to 0 - 1
    float d = (n - CUTOFF) / (1. - CUTOFF); 
        
    //step it
    d = floor(d*STEPS)/STEPS;
    
    return d;
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = fragCoord.xy / iResolution.x;
    float t = iTime * 0.3;    
    vec3 col = vec3(0);
    
    float noise = getNoise(uv, t);
    
    if (noise < CUTOFF) {
        //white wall
        col = vec3(1.,1.,1.); //white
    } else {
        float d = getDepth(noise);
        
        //calc HSV color
        float h = 0.; //rainbow hue
        float s = 0.0;
        float v = 0.9 - (d*0.6); //deeper is darker
        
        //add bevel
        
        //get depth at offset position        
        float noiseOff = getNoise(uv + OFFSET, t);
        float dOff = getDepth(noiseOff);
        
        //if depth of this pixel (d) is less (closer) than offset pixel (dOff)
        //then we are in shadow so darken       
        v -= d - dOff; 
        
        col = hsv2rgb(vec3(h,s,v));
    }
    
    //post proc
    //vertical gradient grey
    col *= 0.7 + (fragCoord.y/iResolution.y *0.3);
    
    //add some slight noise texture
    //col += (sin(uv.x * 100.0 + iTime) * sin(uv.y * 100.0) - 0.5) * 0.05;
    
    fragColor = vec4(col,1.0);
}`;

class IsodepthShader extends ShaderComponent {
  constructor() {
    super();
    this.setFragmentShader(fragmentShader);
  }
}

customElements.define("isodepth-shader", IsodepthShader);
