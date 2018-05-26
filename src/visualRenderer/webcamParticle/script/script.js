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

const POINT_RESOLUTION = 128
const POP_RESOLUTION = 16
const VIDEO_RESOLUTION = 416
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
let pictureFramebuffers = []
let velocityFramebuffers = []
let positionFramebuffers = []
let sceneFramebuffer
let popVelocityFramebuffers = []
let popPositionFramebuffers = []
let videoBufferIndex
let pictureBufferIndex
let velocityBufferIndex
let positionBufferIndex
let sceneBufferIndex
let popVelocityBufferIndex
let popPositionBufferIndex

let videoPrg
let picturePrg
let resetPrg
let positionPrg
let velocityPrg
let scenePrg
let popVelocityPrg
let popPositionPrg
let popScenePrg
let videoScenePrg
let currentPostPrg
let postNonePrg
let postGlitchPrg
let postYkobGlitchPrg
let postDotPrg
let postDotScreenPrg

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
let isDoneInit = false

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

      sceneFramebuffer = createFramebuffer(canvasWidth, canvasHeight)
      bindTexture(sceneFramebuffer.texture, sceneBufferIndex)
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
      isRun = !isRun
      isRun && render()
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

  // 外部ファイルのシェーダのソースを取得しプログラムオブジェクトを生成
  const noneVs = createShader(require('../shader/nothing.vert'), 'vertex')
  {
    const fs = createShader(require('../shader/video.frag'), 'fragment')
    videoPrg = new Program(noneVs, fs)
    if (!videoPrg) return
  }
  {
    const fs = createShader(require('../shader/picture.frag'), 'fragment')
    picturePrg = new Program(noneVs, fs)
    if (!picturePrg) return
  }
  {
    const fs = createShader(require('../shader/reset.frag'), 'fragment')
    resetPrg = new Program(noneVs, fs)
    if (!resetPrg) return
  }
  {
    const fs = createShader(require('../shader/position.frag'), 'fragment')
    positionPrg = new Program(noneVs, fs)
    if (!positionPrg) return
  }
  {
    const fs = createShader(require('../shader/velocity.frag'), 'fragment')
    velocityPrg = new Program(noneVs, fs)
    if (!velocityPrg) return
  }
  {
    const vs = createShader(require('../shader/scene.vert'), 'vertex')
    const fs = createShader(require('../shader/scene.frag'), 'fragment')
    scenePrg = new Program(vs, fs)
    if (!scenePrg) return
  }

  {
    const fs = createShader(require('../shader/pop_velocity.frag'), 'fragment')
    popVelocityPrg = new Program(noneVs, fs)
    if (!popVelocityPrg) return
  }
  {
    const fs = createShader(require('../shader/pop_position.frag'), 'fragment')
    popPositionPrg = new Program(noneVs, fs)
    if (!popPositionPrg) return
  }
  {
    const vs = createShader(require('../shader/pop_scene.vert'), 'vertex')
    const fs = createShader(require('../shader/pop_scene.frag'), 'fragment')
    popScenePrg = new Program(vs, fs)
    if (!popScenePrg) return
  }

  const postVs = createShader(require('../shader/post/post.vert'), 'vertex')
  {
    const fs = createShader(require('../shader/post/scene.frag'), 'fragment')
    videoScenePrg = new Program(noneVs, fs)
    if (!videoScenePrg) return
  }
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
    }
  })

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

  scenePrg.createAttribute({
    data: {
      stride: 4,
      vbo: pointVBO
    }
  })
  scenePrg.createUniform({
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

  videoScenePrg.createAttribute(planeAttribute)
  videoScenePrg.createUniform({
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

  // framebuffer
  let framebufferCount = 1

  for (var i = 0; i < CAPTURE_FRAMEBUFFERS_COUNT; i++) {
    videoFramebuffers.push(createFramebufferFloat(ext, VIDEO_RESOLUTION, VIDEO_RESOLUTION))
  }
  videoBufferIndex = framebufferCount
  framebufferCount += CAPTURE_FRAMEBUFFERS_COUNT

  for (let i = 0; i < GPGPU_FRAMEBUFFERS_COUNT; i++) {
    pictureFramebuffers.push(createFramebufferFloat(ext, POINT_RESOLUTION, POINT_RESOLUTION))
  }
  pictureBufferIndex = framebufferCount
  framebufferCount += GPGPU_FRAMEBUFFERS_COUNT

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

  sceneFramebuffer = createFramebuffer(canvasWidth, canvasHeight)
  sceneBufferIndex = framebufferCount
  framebufferCount += 1

  initVideo()
}

function initVideo () {
  video = media.currentVideo

  init()
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
  // textures
  createTexture(video)

  for (let i = 0; i < CAPTURE_FRAMEBUFFERS_COUNT; ++i) {
    bindTexture(videoFramebuffers[i].texture, videoBufferIndex + i)
  }

  for (let i = 0; i < GPGPU_FRAMEBUFFERS_COUNT; ++i) {
    bindTexture(pictureFramebuffers[i].texture, pictureBufferIndex + i)
  }

  for (let i = 0; i < GPGPU_FRAMEBUFFERS_COUNT; ++i) {
    bindTexture(velocityFramebuffers[i].texture, velocityBufferIndex + i)
  }

  for (let i = 0; i < CAPTURE_FRAMEBUFFERS_COUNT; ++i) {
    bindTexture(positionFramebuffers[i].texture, positionBufferIndex + i)
  }

  for (let i = 0; i < GPGPU_FRAMEBUFFERS_COUNT; ++i) {
    bindTexture(popVelocityFramebuffers[i].texture, popVelocityBufferIndex + i)
  }

  for (let i = 0; i < GPGPU_FRAMEBUFFERS_COUNT; ++i) {
    bindTexture(popPositionFramebuffers[i].texture, popPositionBufferIndex + i)
  }

  bindTexture(sceneFramebuffer.texture, sceneBufferIndex)

  // reset video
  useProgram(videoPrg)
  videoPrg.setAttribute('position')
  videoPrg.setUniform('resolution', [VIDEO_RESOLUTION, VIDEO_RESOLUTION])
  videoPrg.setUniform('videoResolution', [media.currentVideo.videoWidth, media.currentVideo.videoHeight])
  videoPrg.setUniform('videoTexture', 0)
  videoPrg.setUniform('zoom', settings.videoZoom)
  gl.viewport(0, 0, VIDEO_RESOLUTION, VIDEO_RESOLUTION)
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
    gl.viewport(0, 0, VIDEO_RESOLUTION, VIDEO_RESOLUTION)
    useProgram(videoPrg)
    bindFramebuffer(videoFramebuffers[targetBufferIndex].framebuffer)
    videoPrg.setAttribute('position')
    videoPrg.setUniform('resolution', [VIDEO_RESOLUTION, VIDEO_RESOLUTION])
    videoPrg.setUniform('videoResolution', [media.currentVideo.videoWidth, media.currentVideo.videoHeight])
    videoPrg.setUniform('videoTexture', 0)
    videoPrg.setUniform('zoom', settings.videoZoom)
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

    // render to canvas -------------------------------------------
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
        gl.viewport(0, 0, VIDEO_RESOLUTION, VIDEO_RESOLUTION)
        useProgram(videoPrg)
        bindFramebuffer(videoFramebuffers[2].framebuffer)
        videoPrg.setAttribute('position')
        videoPrg.setUniform('resolution', [VIDEO_RESOLUTION, VIDEO_RESOLUTION])
        videoPrg.setUniform('videoResolution', [media.currentVideo.videoWidth, media.currentVideo.videoHeight])
        videoPrg.setUniform('videoTexture', 0)
        videoPrg.setUniform('zoom', settings.videoZoom)
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
      clearColor(0.0, 0.0, 0.0, 0.0)
      gl.clearDepth(1.0)

      useProgram(scenePrg)
      bindFramebuffer(null)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.viewport(0, 0, canvasWidth, canvasHeight)

      rotation.x += (pointer.x - rotation.x) * 0.05
      rotation.y += (pointer.y - rotation.y) * 0.05
      updateCamera()

      scenePrg.setAttribute('data', vbo)
      scenePrg.setUniform('mvpMatrix', mvpMatrix)
      scenePrg.setUniform('pointSize', settings.pointSize * canvasHeight / 930)
      scenePrg.setUniform('videoTexture', videoBufferIndex + targetBufferIndex)
      scenePrg.setUniform('positionTexture', positionBufferIndex + targetBufferIndex)
      scenePrg.setUniform('bgColor', settings.bgColor)
      scenePrg.setUniform('volume', volume)
      scenePrg.setUniform('capturedVideoTexture', videoBufferIndex + 2)
      scenePrg.setUniform('capturedPositionTexture', positionBufferIndex + 2)
      scenePrg.setUniform('isStop', isStop)
      scenePrg.setUniform('isAudio', isAudio)
      scenePrg.setUniform('mode', settings.mode)
      scenePrg.setUniform('pointShape', settings.pointShape)
      scenePrg.setUniform('deformationProgress', settings.deformationProgress)
      scenePrg.setUniform('loopCount', loopCount)
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
      clearColor(0.0, 0.0, 0.0, 0.0)
      gl.clearDepth(1.0)

      useProgram(popScenePrg)
      bindFramebuffer(null)
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
    } else if (settings.scene === 'Post Effect') {
      // Post Effect

      // render to framebuffer
      useProgram(videoScenePrg)
      bindFramebuffer(sceneFramebuffer.framebuffer)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.viewport(0, 0, canvasWidth, canvasHeight)

      videoScenePrg.setAttribute('position')
      videoScenePrg.setUniform('resolution', [canvasWidth, canvasHeight])
      videoScenePrg.setUniform('videoResolution', [media.currentVideo.width, media.currentVideo.height])
      videoScenePrg.setUniform('videoTexture', 0)
      videoScenePrg.setUniform('zoom', settings.videoZoom)
      videoScenePrg.setUniform('focusCount', focusCount)
      videoScenePrg.setUniform('focusPos1', posList[0] || defaultFocus)
      videoScenePrg.setUniform('focusPos2', posList[1] || defaultFocus)
      videoScenePrg.setUniform('focusPos3', posList[2] || defaultFocus)
      videoScenePrg.setUniform('focusPos4', posList[3] || defaultFocus)
      gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)

      // post process
      gl.enable(gl.BLEND)
      clearColor(0.0, 0.0, 0.0, 0.0)
      gl.clearDepth(1.0)

      useProgram(currentPostPrg)
      bindFramebuffer(null)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.viewport(0, 0, canvasWidth, canvasHeight)

      currentPostPrg.setAttribute('position')
      currentPostPrg.setUniform('resolution', [canvasWidth, canvasHeight])
      currentPostPrg.setUniform('texture', sceneBufferIndex)
      currentPostPrg.setUniform('time', time)
      currentPostPrg.setUniform('volume', volume)
      currentPostPrg.setUniform('isAudio', isAudio)
      gl.drawElements(gl.TRIANGLES, planeIndex.length, gl.UNSIGNED_SHORT, 0)
    }

    gl.flush()

    ++loopCount

    // animation loop
    isRun && requestAnimationFrame(render)
  }

  render()
  isDoneInit = true
}

export function update (property, value) {
  if (!isDoneInit) return

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
        // runDetector()
      } else {
        // if (!detector) return

        // detectorMessage.isShow = false
        // resetDetector()
        // detector = null
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
  }
}

export function updateMedia (media) {
  if (!isDoneInit) return

  settings.video = media.videoSource
  settings.audio = media.audioSource
  video = media.currentVideo
}

export function updateZoom (zoom) {
  settings.videoZoom = zoom
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
}
