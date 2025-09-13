

![ship](https://github.com/user-attachments/assets/d60dc034-fa85-4e3d-ba34-e1c9355b9294)


# 🌌 Flow Field Particles with GPGPU

A real-time **flow field particle simulation** built using **WebGL shaders and GPGPU techniques**.  
Millions of particles move seamlessly through a dynamic flow field, powered by the GPU for high performance.  

✨ A mix of **art, math, and code** — turning algorithms into living visuals.  

---

## 🚀 Features
- ⚡ **GPGPU Acceleration** → All particle updates calculated directly on the GPU.  
- 🎨 **Flow Field Simulation** → Particles follow vector fields for organic, natural motion.  
- 🌈 **Customizable Shaders** → Tweak colors, trails, and blending modes.  
- 🖥️ **Real-Time Performance** → Supports millions of particles without CPU bottlenecks.  
- 🔧 **Built for Creative Coding** → Lightweight and extendable.  # 🌌 Flow Field Particles with GPGPU

A real-time **flow field particle simulation** built using **WebGL shaders and GPGPU techniques**.  
Millions of particles move seamlessly through a dynamic flow field, powered by the GPU for high performance.  

✨ A mix of **art, math, and code** — turning algorithms into living visuals.  

---

## 🚀 Features
- ⚡ **GPGPU Acceleration** → All particle updates calculated directly on the GPU.  
- 🎨 **Flow Field Simulation** → Particles follow vector fields for organic, natural motion.  
- 🌈 **Customizable Shaders** → Tweak colors, trails, and blending modes.  
- 🖥️ **Real-Time Performance** → Supports millions of particles without CPU bottlenecks.  
- 🔧 **Built for Creative Coding** → Lightweight and extendable.


🧠 How It Works

Particle Data on GPU → Position & velocity stored in floating-point textures.

Flow Field Force → Each frame, particles sample a flow vector field.

GPGPU Shaders → Fragment shaders update particle positions in parallel.

Rendering → Particles rendered as points/instanced quads with blending.






Download [Node.js](https://nodejs.org/en/download/).
Run this followed commands:

``` bash
# Install dependencies (only the first time)
npm install

# Run the local server at localhost:8080
npm run dev

# Build for production in the dist/ directory
npm run build
```
