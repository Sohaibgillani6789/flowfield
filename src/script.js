import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import GUI from 'lil-gui'
import particlesVertexShader from './shaders/particles/vertex.glsl'
import particlesFragmentShader from './shaders/particles/fragment.glsl'
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js'
import gpgpuParticlesShader from './shaders/gpgpu/particles.glsl'

/**
 * Base
 */
// Debug    
const gui = new GUI({ width: 340 })
const debugObject = {}

// Loader overlay HTML/CSS injection
const loaderOverlay = document.createElement('div')
loaderOverlay.id = 'loader-overlay'
loaderOverlay.innerHTML = `
  <div id="line-container">
    <div id="loader-line"></div>
  </div>
`
loaderOverlay.style.position = 'fixed'
loaderOverlay.style.top = '0'
loaderOverlay.style.left = '0'
loaderOverlay.style.width = '100vw'
loaderOverlay.style.height = '100vh'
loaderOverlay.style.background = '#1b1825'
loaderOverlay.style.zIndex = '9999'
loaderOverlay.style.display = 'flex'
loaderOverlay.style.justifyContent = 'center'
loaderOverlay.style.alignItems = 'center'
loaderOverlay.style.transition = 'opacity 0.7s'
document.body.appendChild(loaderOverlay)

const lineContainer = loaderOverlay.querySelector('#line-container')
lineContainer.style.position = 'absolute'
lineContainer.style.left = '0'
lineContainer.style.top = '50%'
lineContainer.style.transform = 'translateY(-50%)'
lineContainer.style.width = '100vw'
lineContainer.style.height = '8px'

const loaderLine = loaderOverlay.querySelector('#loader-line')
loaderLine.style.position = 'absolute'
loaderLine.style.left = '0'
loaderLine.style.top = '0'
loaderLine.style.height = '4px'
loaderLine.style.background = '#fff'
loaderLine.style.borderRadius = '2px'
loaderLine.style.width = '0px'
loaderLine.style.boxShadow = '0 0 8px #fff'

// Hide canvas while loading
const canvas = document.querySelector('canvas.webgl')
if (canvas) canvas.style.display = 'none'

// Animate line
const animateLoader = () => {
  const duration = 2000 // ms
  const start = performance.now()
  const screenWidth = window.innerWidth
  const endWidth = screenWidth - 40 // 40px margin

  function frame(now) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    loaderLine.style.width = (progress * endWidth) + 'px'
    if (progress < 1) {
      requestAnimationFrame(frame)
    } else {
      loaderOverlay.style.opacity = '0'
      setTimeout(() => {
        loaderOverlay.style.display = 'none'
        if (canvas) canvas.style.display = 'block'
      }, 700)
    }
  }
  requestAnimationFrame(frame)
}

window.addEventListener('DOMContentLoaded', animateLoader)

/**
 * Canvas
 */
const scene = new THREE.Scene()

// Loaders
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Materials
    particles.material.uniforms.uResolution.value.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.set(4.5, 4, 11)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// --- Zoom out animation ---
let zoomOutProgress = 0
const zoomOutDuration = 2 // seconds
const initialCameraPos = new THREE.Vector3(4.5, 4, 11)
const finalCameraPos = new THREE.Vector3(8, 6, 18) // Adjust as needed

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

debugObject.clearColor = '#1b1825'
renderer.setClearColor(debugObject.clearColor)

/**
 * Load model
 */
const gltf = await gltfLoader.loadAsync('./model.glb')

/**
 * Base geometry
 */
const baseGeometry = {}
baseGeometry.instance = gltf.scene.children[0].geometry
baseGeometry.count = baseGeometry.instance.attributes.position.count

/**
 * GPU Compute
 */
// Setup
const gpgpu = {}
gpgpu.size = Math.ceil(Math.sqrt(baseGeometry.count))
gpgpu.computation = new GPUComputationRenderer(gpgpu.size, gpgpu.size, renderer)

// Base particles
const baseParticlesTexture = gpgpu.computation.createTexture()

for(let i = 0; i < baseGeometry.count; i++)
{
    const i3 = i * 3
    const i4 = i * 4

    // Position based on geometry
    baseParticlesTexture.image.data[i4 + 0] = baseGeometry.instance.attributes.position.array[i3 + 0]
    baseParticlesTexture.image.data[i4 + 1] = baseGeometry.instance.attributes.position.array[i3 + 1]
    baseParticlesTexture.image.data[i4 + 2] = baseGeometry.instance.attributes.position.array[i3 + 2]
    baseParticlesTexture.image.data[i4 + 3] = Math.random()
}

// Particles variable
gpgpu.particlesVariable = gpgpu.computation.addVariable('uParticles', gpgpuParticlesShader, baseParticlesTexture)
gpgpu.computation.setVariableDependencies(gpgpu.particlesVariable,[ gpgpu.particlesVariable])

//uniforms
gpgpu.particlesVariable.material.uniforms.uTime = new THREE.Uniform(0)
gpgpu.particlesVariable.material.uniforms.uDeltaTime = new THREE.Uniform(0)
gpgpu.particlesVariable.material.uniforms.uBase = new THREE.Uniform(baseParticlesTexture)
gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence = new THREE.Uniform(0.5)
gpgpu.particlesVariable.material.uniforms.uFlowFieldStrength = new THREE.Uniform(2)
gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency = new THREE.Uniform(0.5)

// Init
gpgpu.computation.init()

// Debug
gpgpu.debug = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 3),
    new THREE.MeshBasicMaterial({
        map: gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture
     })
)

gpgpu.debug.visible = false
gpgpu.debug.position.x = 3
scene.add(gpgpu.debug)

/**
 * Particles
 */
const particles = {}

// Geometry
const particlesUvArray = new Float32Array(baseGeometry.count * 2)
const sizesArray = new Float32Array(baseGeometry.count)

for(let y = 0; y < gpgpu.size; y++)
{
    for(let x = 0; x < gpgpu.size; x++)
    {
        const i = (y * gpgpu.size + x)
        const i2 = i * 2

        //particels uv 
        const uvX = (x + 0.5) / gpgpu.size
        const uvY = (y + 0.5) / gpgpu.size

        particlesUvArray[i2 + 0] = uvX;
        particlesUvArray[i2 + 1] = uvY;
        // Size
        sizesArray[i] = Math.random()
    }
}

particles.geometry = new THREE.BufferGeometry()
particles.geometry.setDrawRange(0, baseGeometry.count)
particles.geometry.setAttribute('aParticlesUv', new THREE.BufferAttribute(particlesUvArray, 2))
particles.geometry.setAttribute('aColor', baseGeometry.instance.attributes.color)
particles.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizesArray, 1))




// Material
particles.material = new THREE.ShaderMaterial({
    vertexShader: particlesVertexShader,
    fragmentShader: particlesFragmentShader,
    uniforms:
    {
        uSize: new THREE.Uniform(0.07),
        uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
        uParticlesTexture: new THREE.Uniform()

    }
})

// Points
particles.points = new THREE.Points(particles.geometry, particles.material)
scene.add(particles.points)

/**
 * Tweaks
 */
gui.addColor(debugObject, 'clearColor').onChange(() => { renderer.setClearColor(debugObject.clearColor) })
gui.add(particles.material.uniforms.uSize, 'value').min(0).max(1).step(0.001).name('uSize')
gui.add(gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence, 'value').min(0).max(1).step(0.001).name('uFlowfieldInfluence')
gui.add(gpgpu.particlesVariable.material.uniforms.uFlowFieldStrength, 'value').min(0).max(10).step(0.001).name('uFlowfieldStrength')
gui.add(gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency, 'value').min(0).max(1).step(0.001).name('uFlowfieldFrequency')

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // --- Zoom out animation ---
    if (zoomOutProgress < 1) {
        zoomOutProgress = Math.min(elapsedTime / zoomOutDuration, 1)
        camera.position.lerpVectors(initialCameraPos, finalCameraPos, zoomOutProgress)
        controls.target.lerp(new THREE.Vector3(0, 0, 0), zoomOutProgress)
        controls.update()
    } else {
        controls.update()
    }

    // GPGPU Update
    gpgpu.particlesVariable.material.uniforms.uTime = elapsedTime
    gpgpu.particlesVariable.material.uniforms.uDeltaTime.value = deltaTime

    gpgpu.computation.compute()
    particles.material.uniforms.uParticlesTexture.value =
    gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture

    // Render normal scene
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()