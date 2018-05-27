import MatIV from './minMatrix.js'
import {
  initWebGL,
  initSize,
  createShader,
  Program,
  createVbo,
  createIbo,
  createTexture,
  bindTexture,
  useProgram,
  bindFramebuffer,
  clearColor,
  getPointVbo
} from './gl-utils.js'
import { setGl, createFramebuffer, createFramebufferFloat, getWebGLExtensions } from './doxas-utils.js'
import { clamp } from './utils.js'
import Tween from './tween.js'
import Detector from './detector.js'

const POINT_RESOLUTION = 128
const POP_RESOLUTION = 16
const BASE_RESOLUTION = 256

const MIN_ZOOM = 2
const MAX_ZOOM = 10

const GPGPU_FRAMEBUFFERS_COUNT = 2
const CAPTURE_FRAMEBUFFERS_COUNT = 3

// const ANIMATION_NORMAL = 0
const ANIMATION_WARP = 1

let options
let canvas
let canvasWidth
let canvasHeight
let gl
let ext
let mat

let planeIndex
let planeVBO
let planeIBO
let pointVBO
let meshPointVBO
let popPointVBO
let mMatrix
let vMatrix
let pMatrix
let vpMatrix
let mvpMatrix

let videoFramebuffers = []
let postSceneFramebuffer
let postSceneLastFramebuffer
let pictureFramebuffers = []
let velocityFramebuffers = []
let positionFramebuffers = []
let particleSceneFramebuffer
let popVelocityFramebuffers = []
let popPositionFramebuffers = []

let videoBufferIndex
let postSceneBufferIndex
let postSceneLastBufferIndex
let pictureBufferIndex
let velocityBufferIndex
let positionBufferIndex
let particleSceneBufferIndex
let popVelocityBufferIndex
let popPositionBufferIndex

let videoPrg
let picturePrg
let resetPrg
let positionPrg
let velocityPrg
let particleScenePrg
let popVelocityPrg
let popPositionPrg
let popScenePrg
let currentPostPrg
let currentPostLastPrg
let postNonePrg
let postGlitchPrg
let postYkobGlitchPrg
let postDotPrg
let postDotScreenPrg
let scenePrg

let render
let media
let settings = {}
let video
let detector
// let detectorMessage
let vbo
let arrayLength
let popArrayLength
let isRun
let pointer = {
  x: 0,
  y: 0
}
let rotation = {
  x: 0,
  y: 0
}
let cameraPosition = {
  x: 0,
  y: 0,
  z: 5
}
let isStop = 0
let isCapture = false
let isAudio = 0
let volume = 1
let defaultFocus = [0, 0, 1, 1]
let deformationProgressTl
let stopMotionTimer

export function run (argOptions) {
  options = argOptions
  settings = options.settings
  media = options.media

  // canvas element を取得しサイズをウィンドウサイズに設定
  const obj = initWebGL(options.canvas)
  canvas = obj.canvas
  gl = obj.gl

  initSize({
    onResize () {
      canvasWidth = canvas.width
      canvasHeight = canvas.height
    }
  })

  canvasWidth = canvas.width
  canvasHeight = canvas.height

  setGl(gl)

  mat = new MatIV()
  // matrix
  mMatrix = mat.identity(mat.create())
  vMatrix = mat.identity(mat.create())
  pMatrix = mat.identity(mat.create())
  vpMatrix = mat.identity(mat.create())
  mvpMatrix = mat.identity(mat.create())

  // 拡張機能を有効化
  ext = getWebGLExtensions()

  // Esc キーで実行を止められるようにイベントを設定
  window.addEventListener('keydown', e => {
    if (e.keyCode === 27) {
      isRun ? stop() : start()
    }
  })

  let timer
  canvas.addEventListener('pointermove', e => {
    if (!settings.pointer) return

    let x = e.clientX / canvasWidth * 2.0 - 1.0
    let y = e.clientY / canvasHeight * 2.0 - 1.0
    pointer = {
      x,
      y: -y
    }

    clearTimeout(timer)
    canvas.classList.add('s-move')
    timer = setTimeout(() => {
      canvas.classList.remove('s-move')
    }, 500)
  })

  canvas.addEventListener('pointerdown', e => {
    settings.rotation = 1
  })

  canvas.addEventListener('pointerup', e => {
    settings.rotation = 0
  })

  canvas.addEventListener('wheel', e => {
    settings.zPosition += e.deltaY * 0.05
    settings.zPosition = clamp(settings.zPosition, MIN_ZOOM, MAX_ZOOM)
  })

  canvas.addEventListener('click', e => {
    if (settings.capture) {
      isCapture = true
    }

    if (settings.detector && detector) {
      detector.detect()
    }
  })

  deformationProgressTl = new Tween(settings, {
    property: 'deformationProgress',
    duration: 700,
    easing: 'easeOutExpo'
  })

  // import shader source code
  const noneVs = createShader(require('../shader/nothing.vert'), 'vertex')

  // video
  {
    const fs = createShader(require('../shader/video.frag'), 'fragment')
    videoPrg = new Program(noneVs, fs)
    if (!videoPrg) return
  }

  // Post Effect
  const postVs = createShader(require('../shader/post/post.vert'), 'vertex')
  {
    const fs = createShader(require('../shader/post/none.frag'), 'fragment')
    postNonePrg = new Program(postVs, fs)
    if (!postNonePrg) return
  }
  {
    const fs = createShader(require('../shader/post/glitch.frag'), 'fragment')
    postGlitchPrg = new Program(postVs, fs)
    if (!postGlitchPrg) return
  }
  {
    const fs = createShader(require('../shader/post/ykobGlitch.frag'), 'fragment')
    postYkobGlitchPrg = new Program(postVs, fs)
    if (!postYkobGlitchPrg) return
  }
  {
    const fs = createShader(require('../shader/post/dot.frag'), 'fragment')
    postDotPrg = new Program(postVs, fs)
    if (!postDotPrg) return
  }
  {
    const fs = createShader(require('../shader/post/DotScreen.frag'), 'fragment')
    postDotScreenPrg = new Program(postVs, fs)
    if (!postDotScreenPrg) return
  }

  // picture
  {
    const fs = createShader(require('../shader/picture.frag'), 'fragment')
    picturePrg = new Program(noneVs, fs)
    if (!picturePrg) return
  }

  // Particle
  {
    const fs = createShader(require('../shader/particle/reset.frag'), 'fragment')
    resetPrg = new Program(noneVs, fs)
    if (!resetPrg) return
  }
  {
    const fs = createShader(require('../shader/particle/position.frag'), 'fragment')
    positionPrg = new Program(noneVs, fs)
    if (!positionPrg) return
  }
  {
    const fs = createShader(require('../shader/particle/velocity.frag'), 'fragment')
    velocityPrg = new Program(noneVs, fs)
    if (!velocityPrg) return
  }
  {
    const vs = createShader(require('../shader/particle/scene.vert'), 'vertex')
    const fs = createShader(require('../shader/particle/scene.frag'), 'fragment')
    particleScenePrg = new Program(vs, fs)
    if (!particleScenePrg) return
  }

  // Pop
  {
    const fs = createShader(require('../shader/particle/pop_velocity.frag'), 'fragment')
    popVelocityPrg = new Program(noneVs, fs)
    if (!popVelocityPrg) return
  }
  {
    const fs = createShader(require('../shader/particle/pop_position.frag'), 'fragment')
    popPositionPrg = new Program(noneVs, fs)
    if (!popPositionPrg) return
  }
  {
    const vs = createShader(require('../shader/particle/pop_scene.vert'), 'vertex')
    const fs = createShader(require('../shader/particle/pop_scene.frag'), 'fragment')
    popScenePrg = new Program(vs, fs)
    if (!popScenePrg) return
  }

  // render
  {
    const vs = createShader(require('../shader/scene.vert'), 'vertex')
    const fs = createShader(require('../shader/scene.frag'), 'fragment')
    scenePrg = new Program(vs, fs)
    if (!scenePrg) return
  }

  initGlsl()
}

function initGlsl () {
  const interval = BASE_RESOLUTION / POINT_RESOLUTION / BASE_RESOLUTION

  pointVBO = getPointVbo(interval)

  const pointTexCoord = []
  for (let t = 0; t < 1 - interval; t += interval) {
    for (let s = 0; s < 1; s += interval) {
      if (s === BASE_RESOLUTION - interval) {
        pointTexCoord.push(s, t, Math.random(), Math.random())
        pointTexCoord.push(s, t + interval, Math.random(), Math.random())
      } else {
        pointTexCoord.push(s, t, Math.random(), Math.random())
        pointTexCoord.push(s, t + interval, Math.random(), Math.random())
        pointTexCoord.push(s + interval, t + interval, Math.random(), Math.random())
        pointTexCoord.push(s, t, Math.random(), Math.random())
      }
    }
  }
  meshPointVBO = createVbo(pointTexCoord)

  popPointVBO = getPointVbo(1 / POP_RESOLUTION)
  popArrayLength = POP_RESOLUTION * POP_RESOLUTION

  // vertices
  let planeCoord = [1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0]
  planeIndex = [0, 1, 2, 2, 1, 3]
  planeVBO = createVbo(planeCoord)
  planeIBO = createIbo(planeIndex)

  const planeAttribute = {
    position: {
      stride: 3,
      vbo: planeVBO,
      ibo: planeIBO
    }
  }

  // video
  videoPrg.createAttribute(planeAttribute)
  videoPrg.createUniform({
    resolution: {
      type: '2fv'
    },
    videoResolution: {
      type: '2fv'
    },
    videoTexture: {
      type: '1i'
    },
    zoom: {
      type: '1f'
    },
    focusCount: {
      type: '1f'
    },
    focusPos1: {
      type: '4fv'
    },
    focusPos2: {
      type: '4fv'
    },
    focusPos3: {
      type: '4fv'
    },
    focusPos4: {
      type: '4fv'
    }
  })

  // Post Effect
  function setPostVariables (prg) {
    prg.createAttribute(planeAttribute)
    prg.createUniform({
      resolution: {
        type: '2fv'
      },
      texture: {
        type: '1i'
      },
      time: {
        type: '1f'
      },
      volume: {
        type: '1f'
      },
      isAudio: {
        type: '1f'
      }
    })
  }
  setPostVariables(postNonePrg)
  setPostVariables(postGlitchPrg)
  setPostVariables(postYkobGlitchPrg)
  setPostVariables(postDotPrg)
  setPostVariables(postDotScreenPrg)

  // picture
  picturePrg.createAttribute(planeAttribute)
  picturePrg.createUniform({
    resolution: {
      type: '2fv'
    },
    videoTexture: {
      type: '1i'
    },
    prevVideoTexture: {
      type: '1i'
    },
    prevPictureTexture: {
      type: '1i'
    }
  })

  // Particle
  resetPrg.createAttribute(planeAttribute)
  resetPrg.createUniform({
    resolution: {
      type: '2fv'
    },
    videoTexture: {
      type: '1i'
    }
  })

  velocityPrg.createAttribute(planeAttribute)
  velocityPrg.createUniform({
    resolution: {
      type: '2fv'
    },
    prevVelocityTexture: {
      type: '1i'
    },
    pictureTexture: {
      type: '1i'
    },
    animation: {
      type: '1f'
    },
    isAccel: {
      type: '1f'
    },
    isRotation: {
      type: '1f'
    }
  })

  positionPrg.createAttribute(planeAttribute)
  positionPrg.createUniform({
    resolution: {
      type: '2fv'
    },
    prevPositionTexture: {
      type: '1i'
    },
    velocityTexture: {
      type: '1i'
    },
    pictureTexture: {
      type: '1i'
    },
    animation: {
      type: '1f'
    }
  })

  particleScenePrg.createAttribute({
    data: {
      stride: 4,
      vbo: pointVBO
    }
  })
  particleScenePrg.createUniform({
    mvpMatrix: {
      type: 'Matrix4fv'
    },
    pointSize: {
      type: '1f'
    },
    videoTexture: {
      type: '1i'
    },
    positionTexture: {
      type: '1i'
    },
    bgColor: {
      type: '1f'
    },
    volume: {
      type: '1f'
    },
    capturedVideoTexture: {
      type: '1i'
    },
    capturedPositionTexture: {
      type: '1i'
    },
    isStop: {
      type: '1f'
    },
    isAudio: {
      type: '1f'
    },
    mode: {
      type: '1f'
    },
    pointShape: {
      type: '1f'
    },
    deformationProgress: {
      type: '1f'
    },
    loopCount: {
      type: '1f'
    }
  })

  // Pop
  popVelocityPrg.createAttribute(planeAttribute)
  popVelocityPrg.createUniform({
    resolution: {
      type: '2fv'
    },
    prevVelocityTexture: {
      type: '1i'
    },
    pictureTexture: {
      type: '1i'
    }
  })

  popPositionPrg.createAttribute(planeAttribute)
  popPositionPrg.createUniform({
    resolution: {
      type: '2fv'
    },
    prevPositionTexture: {
      type: '1i'
    },
    velocityTexture: {
      type: '1i'
    },
    pictureTexture: {
      type: '1i'
    }
  })

  popScenePrg.createAttribute({
    data: {
      stride: 4,
      vbo: popPointVBO
    }
  })
  popScenePrg.createUniform({
    mvpMatrix: {
      type: 'Matrix4fv'
    },
    resolution: {
      type: '2fv'
    },
    pointSize: {
      type: '1f'
    },
    videoTexture: {
      type: '1i'
    },
    positionTexture: {
      type: '1i'
    },
    velocityTexture: {
      type: '1i'
    },
    bgColor: {
      type: '1f'
    },
    volume: {
      type: '1f'
    },
    isAudio: {
      type: '1f'
    },
    deformationProgress: {
      type: '1f'
    },
    time: {
      type: '1f'
    }
  })

  // render
  scenePrg.createAttribute(planeAttribute)
  scenePrg.createUniform({
    particleTexture: {
      type: '1i'
    },
    postTexture: {
      type: '1i'
    },
    videoAlpha: {
      type: '1f'
    },
    particleAlpha: {
      type: '1f'
    }
  })

  // framebuffer
  let framebufferCount = 1

  // video
  for (var i = 0; i < CAPTURE_FRAMEBUFFERS_COUNT; i++) {
    videoFramebuffers.push(createFramebuffer(canvasWidth, canvasHeight))
  }
  videoBufferIndex = framebufferCount
  framebufferCount += CAPTURE_FRAMEBUFFERS_COUNT

  // Post Effect
  postSceneFramebuffer = createFramebuffer(canvasWidth, canvasHeight)
  postSceneBufferIndex = framebufferCount
  framebufferCount += 1

  // last effect
  postSceneLastFramebuffer = createFramebuffer(canvasWidth, canvasHeight)
  postSceneLastBufferIndex = framebufferCount
  framebufferCount += 1

  // picture
  for (let i = 0; i < GPGPU_FRAMEBUFFERS_COUNT; i++) {
    pictureFramebuffers.push(createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION))
  }
  pictureBufferIndex = framebufferCount
  framebufferCount += GPGPU_FRAMEBUFFERS_COUNT

  // Particle
  for (let i = 0; i < GPGPU_FRAMEBUFFERS_COUNT; i++) {
    velocityFramebuffers.push(createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION))
  }
  velocityBufferIndex = framebufferCount
  framebufferCount += GPGPU_FRAMEBUFFERS_COUNT

  for (let i = 0; i < CAPTURE_FRAMEBUFFERS_COUNT; i++) {
    positionFramebuffers.push(createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION))
  }
  positionBufferIndex = framebufferCount
  framebufferCount += CAPTURE_FRAMEBUFFERS_COUNT

  particleSceneFramebuffer = createFramebuffer(canvasWidth, canvasHeight)
  particleSceneBufferIndex = framebufferCount
  framebufferCount += 1

  // Pop
  for (let i = 0; i < GPGPU_FRAMEBUFFERS_COUNT; i++) {
    popVelocityFramebuffers.push(createFramebufferFloat(ext, POP_RESOLUTION, POP_RESOLUTION))
  }
  popVelocityBufferIndex = framebufferCount
  framebufferCount += GPGPU_FRAMEBUFFERS_COUNT

  for (let i = 0; i < GPGPU_FRAMEBUFFERS_COUNT; i++) {
    popPositionFramebuffers.push(createFramebufferFloat(ext, POP_RESOLUTION, POP_RESOLUTION))
  }
  popPositionBufferIndex = framebufferCount
  framebufferCount += GPGPU_FRAMEBUFFERS_COUNT

  initVideo()
}

function initVideo () {
  video = media.currentVideo

  if (detector) {
    resetDetector()
    runDetector()
  }

  init()
}

async function runDetector () {
  detector = new Detector(media.webcam, media.wrapper)
  await detector.promise
  detector.detect()
  // detectorMessage.isReady = true
}

function resetDetector () {
  detector.reset()
  // detectorMessage.isReady = false
}

function updateCamera () {
  const cameraPositionRate = settings.animation === ANIMATION_WARP ? 1.5 : 0.3
  cameraPosition.x += (pointer.x * cameraPositionRate - cameraPosition.x) * 0.1
  cameraPosition.y += (pointer.y * cameraPositionRate - cameraPosition.y) * 0.1
  cameraPosition.z += (settings.zPosition - cameraPosition.z) * 0.1

  mat.identity(mMatrix)
  mat.lookAt(
    [cameraPosition.x, cameraPosition.y, cameraPosition.z / (BASE_RESOLUTION / POINT_RESOLUTION)],
    [cameraPosition.x, cameraPosition.y, 0.0],
    [0.0, 1.0, 0.0],
    vMatrix
  )
  mat.perspective(60, canvasWidth / canvasHeight, 0.1, 20.0, pMatrix)
  mat.multiply(pMatrix, vMatrix, vpMatrix)

  mat.rotate(mMatrix, rotation.x, [0.0, 1.0, 0.0], mMatrix)
  mat.rotate(mMatrix, rotation.y, [-1.0, 0.0, 0.0], mMatrix)
  mat.multiply(vpMatrix, mMatrix, mvpMatrix)
}

function init () {
  // init settings
  Object.keys(settings).forEach(key => {
    update(key, settings[key])
  })

  // textures
  createTexture(video)

  // video
  for (let i = 0; i < CAPTURE_FRAMEBUFFERS_COUNT; ++i) {
    bindTexture(videoFramebuffers[i].texture, videoBufferIndex + i)
  }

  // Post Effect
  bindTexture(postSceneFramebuffer.texture, postSceneBufferIndex)
  bindTexture(postSceneLastFramebuffer.texture, postSceneLastBufferIndex)

  // picture
  for (let i = 0; i < GPGPU_FRAMEBUFFERS_COUNT; ++i) {
    bindTexture(pictureFramebuffers[i].texture, pictureBufferIndex + i)
  }

  // Particle
  for (let i = 0; i < GPGPU_FRAMEBUFFERS_COUNT; ++i) {
    bindTexture(velocityFramebuffers[i].texture, velocityBufferIndex + i)
  }
  for (let i = 0; i < CAPTURE_FRAMEBUFFERS_COUNT; ++i) {
    bindTexture(positionFramebuffers[i].texture, positionBufferIndex + i)
  }
  bindTexture(particleSceneFramebuffer.texture, particleSceneBufferIndex)

  // Pop
  for (let i = 0; i < GPGPU_FRAMEBUFFERS_COUNT; ++i) {
    bindTexture(popVelocityFramebuffers[i].texture, popVelocityBufferIndex + i)
  }
  for (let i = 0; i < GPGPU_FRAMEBUFFERS_COUNT; ++i) {
    bindTexture(popPositionFramebuffers[i].texture, popPositionBufferIndex + i)
  }

  const posList = (detector && detector.posList) || []
  const focusCount = Math.min(posList.length || 1, 4)

  // reset video
  gl.viewport(0, 0, canvasWidth, canvasWidth)
  useProgram(videoPrg)
  videoPrg.setAttribute('position')
  videoPrg.setUniform('resolution', [canvasWidth, canvasHeight])
  videoPrg.setUniform('videoResolution', [video.videoWidth, video.videoHeight])
  videoPrg.setUniform('videoTexture', 0)
  videoPrg.setUniform('zoom', settings.videoZoom)
  videoPrg.setUniform('focusCount', focusCount)
  videoPrg.setUniform('focusPos1', posList[0] || defaultFocus)
  videoPrg.setUniform('focusPos2', posList[1] || defaultFocus)
  videoPrg.setUniform('focusPos3', posList[2] || defaultFocus)
  videoPrg.setUniform('focusPos4', posList[3] || defaultFocus)
  for (let targetBufferIndex = 0; targetBufferIndex < CAPTURE_FRAMEBUFFERS_COUNT; ++targetBufferIndex) {
    // video buffer
    bindFramebuffer(videoFramebuffers[targetBufferIndex].framebuffer)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }

  // reset picture
  useProgram(picturePrg)
  picturePrg.setAttribute('position')
  picturePrg.setUniform('resolution', [POINT_RESOLUTION, POINT_RESOLUTION])
  picturePrg.setUniform('videoTexture', 0)
  gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION)
  for (let targetBufferIndex = 0; targetBufferIndex < GPGPU_FRAMEBUFFERS_COUNT; ++targetBufferIndex) {
    // picture buffer
    bindFramebuffer(pictureFramebuffers[targetBufferIndex].framebuffer)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }

  // reset particle position
  useProgram(resetPrg)
  resetPrg.setAttribute('position')
  resetPrg.setUniform('resolution', [POINT_RESOLUTION, POINT_RESOLUTION])
  resetPrg.setUniform('videoTexture', 0)
  gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION)
  for (let targetBufferIndex = 0; targetBufferIndex < GPGPU_FRAMEBUFFERS_COUNT; ++targetBufferIndex) {
    // velocity buffer
    bindFramebuffer(velocityFramebuffers[targetBufferIndex].framebuffer)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }
  for (let targetBufferIndex = 0; targetBufferIndex < CAPTURE_FRAMEBUFFERS_COUNT; ++targetBufferIndex) {
    // position buffer
    bindFramebuffer(positionFramebuffers[targetBufferIndex].framebuffer)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }

  // reset pop position
  useProgram(resetPrg)
  resetPrg.setAttribute('position')
  resetPrg.setUniform('resolution', [POP_RESOLUTION, POP_RESOLUTION])
  resetPrg.setUniform('videoTexture', 0)
  gl.viewport(0, 0, POP_RESOLUTION, POP_RESOLUTION)
  for (let targetBufferIndex = 0; targetBufferIndex < GPGPU_FRAMEBUFFERS_COUNT; ++targetBufferIndex) {
    // pop velocity buffer
    bindFramebuffer(popVelocityFramebuffers[targetBufferIndex].framebuffer)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }
  for (let targetBufferIndex = 0; targetBufferIndex < GPGPU_FRAMEBUFFERS_COUNT; ++targetBufferIndex) {
    // pop position buffer
    bindFramebuffer(popPositionFramebuffers[targetBufferIndex].framebuffer)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
  }

  // flags
  gl.disable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE)

  // setting
  let loopCount = 0
  isRun = true

  vbo = pointVBO
  arrayLength = POINT_RESOLUTION * POINT_RESOLUTION

  render = () => {
    const targetBufferIndex = loopCount % 2
    const prevBufferIndex = 1 - targetBufferIndex
    const time = loopCount / 60

    const posList = (detector && detector.posList) || []
    const focusCount = Math.min(posList.length || 1, 4)

    volume += (media.getVolume() - volume) * 0.1

    // video texture
    createTexture(video)

    // update gpgpu buffers -------------------------------------------
    gl.disable(gl.BLEND)

    // video update
    gl.viewport(0, 0, canvasWidth, canvasWidth)
    useProgram(videoPrg)
    bindFramebuffer(videoFramebuffers[targetBufferIndex].framebuffer)
    videoPrg.setAttribute('position')
    videoPrg.setUniform('resolution', [canvasWidth, canvasHeight])
    videoPrg.setUniform('videoResolution', [video.videoWidth, video.videoHeight])
    videoPrg.setUniform('videoTexture', 0)
    videoPrg.setUniform('zoom', settings.videoZoom)
    videoPrg.setUniform('focusCount', focusCount)
    videoPrg.setUniform('focusPos1', posList[0] || defaultFocus)
    videoPrg.setUniform('focusPos2', posList[1] || defaultFocus)
    videoPrg.setUniform('focusPos3', posList[2] || defaultFocus)
    videoPrg.setUniform('focusPos4', posList[3] || defaultFocus)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    // Post Effect
    useProgram(currentPostPrg)
    bindFramebuffer(postSceneFramebuffer.framebuffer)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.viewport(0, 0, canvasWidth, canvasHeight)

    currentPostPrg.setAttribute('position')
    currentPostPrg.setUniform('resolution', [canvasWidth, canvasHeight])
    currentPostPrg.setUniform('texture', videoBufferIndex + targetBufferIndex)
    currentPostPrg.setUniform('time', time)
    currentPostPrg.setUniform('volume', volume)
    currentPostPrg.setUniform('isAudio', isAudio)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    // last effect
    useProgram(currentPostLastPrg)
    bindFramebuffer(postSceneLastFramebuffer.framebuffer)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.viewport(0, 0, canvasWidth, canvasHeight)

    currentPostLastPrg.setAttribute('position')
    currentPostLastPrg.setUniform('resolution', [canvasWidth, canvasHeight])
    currentPostLastPrg.setUniform('texture', postSceneBufferIndex)
    currentPostLastPrg.setUniform('time', time)
    currentPostLastPrg.setUniform('volume', volume)
    currentPostLastPrg.setUniform('isAudio', isAudio)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION)

    // picture update
    useProgram(picturePrg)
    bindFramebuffer(pictureFramebuffers[targetBufferIndex].framebuffer)
    picturePrg.setAttribute('position')
    picturePrg.setUniform('resolution', [POINT_RESOLUTION, POINT_RESOLUTION])
    picturePrg.setUniform('videoTexture', videoBufferIndex + targetBufferIndex)
    picturePrg.setUniform('prevVideoTexture', videoBufferIndex + prevBufferIndex)
    picturePrg.setUniform('prevPictureTexture', pictureBufferIndex + prevBufferIndex)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    if (settings.scene === 'Particle') {
      // Particle

      // velocity update
      useProgram(velocityPrg)
      bindFramebuffer(velocityFramebuffers[targetBufferIndex].framebuffer)
      velocityPrg.setAttribute('position')
      velocityPrg.setUniform('resolution', [POINT_RESOLUTION, POINT_RESOLUTION])
      velocityPrg.setUniform('prevVelocityTexture', velocityBufferIndex + prevBufferIndex)
      velocityPrg.setUniform('pictureTexture', pictureBufferIndex + targetBufferIndex)
      velocityPrg.setUniform('animation', settings.animation)
      velocityPrg.setUniform('isAccel', settings.accel)
      velocityPrg.setUniform('isRotation', settings.rotation)
      gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

      // position update
      useProgram(positionPrg)
      bindFramebuffer(positionFramebuffers[targetBufferIndex].framebuffer)
      positionPrg.setAttribute('position')
      positionPrg.setUniform('resolution', [POINT_RESOLUTION, POINT_RESOLUTION])
      positionPrg.setUniform('prevPositionTexture', positionBufferIndex + prevBufferIndex)
      positionPrg.setUniform('velocityTexture', velocityBufferIndex + targetBufferIndex)
      positionPrg.setUniform('pictureTexture', pictureBufferIndex + targetBufferIndex)
      positionPrg.setUniform('animation', settings.animation)
      gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

      if (isCapture) {
        gl.viewport(0, 0, canvasWidth, canvasHeight)
        useProgram(videoPrg)
        bindFramebuffer(videoFramebuffers[2].framebuffer)
        videoPrg.setAttribute('position')
        videoPrg.setUniform('resolution', [canvasWidth, canvasHeight])
        videoPrg.setUniform('videoResolution', [video.videoWidth, video.videoHeight])
        videoPrg.setUniform('videoTexture', 0)
        videoPrg.setUniform('zoom', settings.videoZoom)
        videoPrg.setUniform('focusCount', focusCount)
        videoPrg.setUniform('focusPos1', posList[0] || defaultFocus)
        videoPrg.setUniform('focusPos2', posList[1] || defaultFocus)
        videoPrg.setUniform('focusPos3', posList[2] || defaultFocus)
        videoPrg.setUniform('focusPos4', posList[3] || defaultFocus)
        gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

        gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION)

        useProgram(positionPrg)
        bindFramebuffer(positionFramebuffers[2].framebuffer)
        positionPrg.setAttribute('position')
        positionPrg.setUniform('resolution', [POINT_RESOLUTION, POINT_RESOLUTION])
        positionPrg.setUniform('prevPositionTexture', positionBufferIndex + prevBufferIndex)
        positionPrg.setUniform('velocityTexture', velocityBufferIndex + targetBufferIndex)
        positionPrg.setUniform('pictureTexture', pictureBufferIndex + targetBufferIndex)
        positionPrg.setUniform('animation', settings.animation)
        gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

        isCapture = false
      }

      gl.enable(gl.BLEND)

      useProgram(particleScenePrg)
      bindFramebuffer(particleSceneFramebuffer.framebuffer)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.viewport(0, 0, canvasWidth, canvasHeight)

      rotation.x += (pointer.x - rotation.x) * 0.05
      rotation.y += (pointer.y - rotation.y) * 0.05
      updateCamera()

      particleScenePrg.setAttribute('data', vbo)
      particleScenePrg.setUniform('mvpMatrix', mvpMatrix)
      particleScenePrg.setUniform('pointSize', settings.pointSize * canvasHeight / 930)
      particleScenePrg.setUniform('videoTexture', videoBufferIndex + targetBufferIndex)
      particleScenePrg.setUniform('positionTexture', positionBufferIndex + targetBufferIndex)
      particleScenePrg.setUniform('bgColor', settings.bgColor)
      particleScenePrg.setUniform('volume', volume)
      particleScenePrg.setUniform('capturedVideoTexture', videoBufferIndex + 2)
      particleScenePrg.setUniform('capturedPositionTexture', positionBufferIndex + 2)
      particleScenePrg.setUniform('isStop', isStop)
      particleScenePrg.setUniform('isAudio', isAudio)
      particleScenePrg.setUniform('mode', settings.mode)
      particleScenePrg.setUniform('pointShape', settings.pointShape)
      particleScenePrg.setUniform('deformationProgress', settings.deformationProgress)
      particleScenePrg.setUniform('loopCount', loopCount)
      gl.drawArrays(settings.mode, 0, arrayLength)
    } else if (settings.scene === 'Pop') {
      // Pop

      gl.viewport(0, 0, POP_RESOLUTION, POP_RESOLUTION)

      // velocity update
      useProgram(popVelocityPrg)
      bindFramebuffer(popVelocityFramebuffers[targetBufferIndex].framebuffer)
      popVelocityPrg.setAttribute('position')
      popVelocityPrg.setUniform('resolution', [POP_RESOLUTION, POP_RESOLUTION])
      popVelocityPrg.setUniform('prevVelocityTexture', popVelocityBufferIndex + prevBufferIndex)
      popVelocityPrg.setUniform('pictureTexture', pictureBufferIndex + targetBufferIndex)
      gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

      // position update
      useProgram(popPositionPrg)
      bindFramebuffer(popPositionFramebuffers[targetBufferIndex].framebuffer)
      popPositionPrg.setAttribute('position')
      popPositionPrg.setUniform('resolution', [POP_RESOLUTION, POP_RESOLUTION])
      popPositionPrg.setUniform('prevPositionTexture', popPositionBufferIndex + prevBufferIndex)
      popPositionPrg.setUniform('velocityTexture', popVelocityBufferIndex + targetBufferIndex)
      popPositionPrg.setUniform('pictureTexture', pictureBufferIndex + targetBufferIndex)
      gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

      gl.enable(gl.BLEND)

      useProgram(popScenePrg)
      bindFramebuffer(particleSceneFramebuffer.framebuffer)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.viewport(0, 0, canvasWidth, canvasHeight)

      rotation.x += (pointer.x - rotation.x) * 0.01
      rotation.y += (pointer.y - rotation.y) * 0.01
      updateCamera()

      popScenePrg.setAttribute('data')
      popScenePrg.setUniform('mvpMatrix', mvpMatrix)
      popScenePrg.setUniform('resolution', [canvasWidth, canvasHeight])
      popScenePrg.setUniform('pointSize', settings.pointSize * canvasHeight / 930)
      popScenePrg.setUniform('videoTexture', videoBufferIndex + targetBufferIndex)
      popScenePrg.setUniform('positionTexture', popPositionBufferIndex + targetBufferIndex)
      popScenePrg.setUniform('velocityTexture', popVelocityBufferIndex + targetBufferIndex)
      popScenePrg.setUniform('bgColor', settings.bgColor)
      popScenePrg.setUniform('volume', volume)
      popScenePrg.setUniform('isAudio', isAudio)
      popScenePrg.setUniform('deformationProgress', settings.deformationProgress)
      popScenePrg.setUniform('time', time)
      gl.drawArrays(gl.POINTS, 0, popArrayLength)
    }

    // render to canvas -------------------------------------------
    gl.enable(gl.BLEND)
    clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clearDepth(1.0)

    useProgram(scenePrg)
    bindFramebuffer(null)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.viewport(0, 0, canvasWidth, canvasHeight)

    scenePrg.setAttribute('position')
    scenePrg.setUniform('particleTexture', particleSceneBufferIndex)
    scenePrg.setUniform('postTexture', postSceneLastBufferIndex)
    scenePrg.setUniform('videoAlpha', settings.videoAlpha)
    scenePrg.setUniform('particleAlpha', settings.particleAlpha)
    gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

    gl.flush()

    // animation loop
    if (isRun) {
      ++loopCount
      requestAnimationFrame(render)
    }
  }

  render()
}

export function update (property, value) {
  settings[property] = value

  switch (property) {
    case 'lineShape':
      switch (settings.lineShape) {
        case 'mesh':
          vbo = meshPointVBO
          arrayLength = (4 * (POINT_RESOLUTION - 1) + 2) * (POINT_RESOLUTION - 1)
          break
        case 'line':
        default:
          vbo = pointVBO
          arrayLength = POINT_RESOLUTION * POINT_RESOLUTION
      }
      break
    case 'deformation':
      settings.deformation ? deformationProgressTl.play() : deformationProgressTl.reverse()
      break
    case 'bgColor':
      let rgbInt = settings.bgColor * 255
      document.body.style.backgroundColor = `rgb(${rgbInt}, ${rgbInt}, ${rgbInt})`
      break
    case 'pointer':
      if (!settings.pointer) {
        pointer = {
          x: 0,
          y: 0
        }
      }
      break
    case 'capture':
      isStop = settings.capture ? 1 : 0
      isCapture = settings.capture
      break
    case 'stopMotion':
      isStop = settings.stopMotion ? 1 : 0
      if (settings.stopMotion) {
        stopMotionTimer = setInterval(() => {
          isCapture = true
        }, 1000 / 3)
      } else {
        clearTimeout(stopMotionTimer)
      }
      break
    case 'detector':
      if (settings.detector) {
        // detectorMessage.isShow = true
        runDetector()
      } else {
        if (!detector) return

        // detectorMessage.isShow = false
        resetDetector()
        detector = null
      }
      break
    case 'effect':
      switch (settings.effect) {
        case 'glitch':
          currentPostPrg = postGlitchPrg
          break
        case 'ykob glitch':
          currentPostPrg = postYkobGlitchPrg
          break
        case 'dot':
          currentPostPrg = postDotPrg
          break
        case 'dot screen':
          currentPostPrg = postDotScreenPrg
          break
        case 'none':
        default:
          currentPostPrg = postNonePrg
      }
      break
    case 'lastEffect':
      switch (settings.lastEffect) {
        case 'glitch':
          currentPostLastPrg = postGlitchPrg
          break
        case 'ykob glitch':
          currentPostLastPrg = postYkobGlitchPrg
          break
        case 'dot':
          currentPostLastPrg = postDotPrg
          break
        case 'dot screen':
          currentPostLastPrg = postDotScreenPrg
          break
        case 'none':
        default:
          currentPostLastPrg = postNonePrg
      }
      break
  }
}

export function updateVideo () {
  video = media.currentVideo
}

export function updateZoom (zoom) {
  settings.videoZoom = zoom
}

export function updateAlpha (alpha) {
  settings.videoAlpha = alpha
}

export function updateInputAudio (inputAudio) {
  settings.inputAudio = inputAudio
  isAudio = settings.inputAudio ? 1 : 0
}

export function stop () {
  isRun = false
}

export function start () {
  isRun = true
  render()
}
