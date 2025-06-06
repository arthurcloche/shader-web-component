import { ShaderComponent } from "./shader-component.js";

const fragmentShader = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
out vec4 fragColor;

#define GAMMA 2.2

//For when the derivatives must be manually calculated
float antialias_l2_dxy(float d, vec2 dxy)
{
    //Get gradient width
    float width = length(dxy);
    //Calculate reciprocal scale (avoid division by 0!)
    float scale = width>0.0? 1.0/width : 1e7;
    //Normalize the gradient d with it's scale
    return clamp(0.5 + 0.7 * scale * d, 0.0, 1.0);
}
//Sine-base hue function
vec3 color(float index)
{
    return cos(index+vec3(0,2,4))*0.5+0.5;
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    //Normalize screen coordinates (aspect ratio corrected)
    vec2 uv = (fragCoord-0.5*iResolution.xy) / iResolution.y;

    //Generate a little pattern
    float value = cos(uv.x*9.)*cos(uv.y*9.)*3.+uv.x*7.+uv.y*9.+iTime;
    
    //Get the gradient from the pattern
    float stripe_grad = value;
    //Break into stripe steps
    float stripe_step = round(stripe_grad);
    //Find the gradient to the nearest edge
    float stripe_frac = stripe_grad - stripe_step;
    
    //Calculate the derivatives on the continous gradient
    vec2 dxy = vec2(dFdx(stripe_grad), dFdy(stripe_grad));
    
    //Blend between the two nearest stripes
    vec3 c1 = color(stripe_step+0.0);
    vec3 c2 = color(stripe_step+1.0);
    //Anti-aliasing like normal
    vec3 col = mix(c1, c2, antialias_l2_dxy(stripe_frac,dxy));

    // Output to screen
    fragColor = vec4(pow(col, 1.0/vec3(GAMMA)),1.0);
}`;

class AablobsShader extends ShaderComponent {
  constructor() {
    super();
    this.setFragmentShader(fragmentShader);
  }
}

customElements.define("aablobs-shader", AablobsShader);
