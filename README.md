# Shader Web Components

This project showcases a collection of WebGL fragment shaders implemented as web components. Each shader is encapsulated as a custom HTML element, making it easy to add beautiful, interactive visual effects to any webpage.

## Features

- 20+ different shader effects
- Fully encapsulated as custom elements
- Responsive design
- Mouse interaction support
- Efficient rendering with visibility detection

## Usage

Simply include the desired shader component in your HTML:

```html
<!-- Include the component script -->
<script src="shaders/GlossyShader.js" type="module"></script>

<!-- Use the component anywhere in your HTML -->
<glossy-shader width="800" height="500"></glossy-shader>
```

## Available Shaders

- Glossy
- Glowing Particles
- Aurora
- Ripples
- Watercolor
- Flow
- Turbulence Hex
- Halofield
- AA Blobs
- Paint Blob
- Fractal Bubble
- Ice Cream
- Triangle Fractal
- Geometric Tiling
- Lozeng
- Isolines
- Isodepth
- And more...

## Implementation

Each shader component extends the base `ShaderComponent` class which handles:

- WebGL context creation
- Shader program compilation
- Uniform management
- Visibility detection with IntersectionObserver
- Efficient rendering loop
- Mouse interaction tracking

## License

MIT 