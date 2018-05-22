import { ipcRenderer } from 'electron'
// import dat from 'dat.gui/build/dat.gui.js'

import configs from '../../assets/json/js/webcamParticle/scene.json'

export default function () {
  const json = require('./gui/scene.json')
  const preset = location.search.substring(1) || json.preset
  const gui = new dat.GUI({
    load: json,
    preset: preset
  })
  let particleFolder
  let postFolder
  let thumbController
  let videoController
  let changeDetector

  data = json.remembered[preset][0]
  gui.remember(data)

  // scene
  const sceneMap = ['Particle', 'Pop', 'Post Effect']
  const changeScene = () => {
    particleFolder.close()
    postFolder.close()

    switch (data.scene) {
      case 'Pop':
        particleFolder.open()
        break
      case 'Post Effect':
        postFolder.open()
        break
      case 'Particle':
      default:
        particleFolder.open()
    }
  }
  gui.add(data, 'scene', sceneMap).onChange(changeScene)

  // Particle folder
  {
    let pointFolder
    let lineFolder

    particleFolder = gui.addFolder('Particle')

    // animation
    const animationMap = { normal: ANIMATION_NORMAL, warp: ANIMATION_WARP }
    particleFolder.add(data, 'animation', animationMap)

    // mode
    const modeMap = {
      'gl.POINTS': gl.POINTS,
      'gl.LINE_STRIP': gl.LINE_STRIP,
      'gl.TRIANGLES': gl.TRIANGLES
    }
    const changeMode = () => {
      pointFolder.close()
      lineFolder.close()

      switch (Number(data.mode)) {
        case gl.LINE_STRIP:
        case gl.TRIANGLES:
          lineFolder.open()
          break
        case gl.POINTS:
        default:
          pointFolder.open()
      }
    }
    particleFolder.add(data, 'mode', modeMap).onChange(changeMode)

    // point folder
    pointFolder = particleFolder.addFolder('gl.POINTS')

    // pointShape
    const pointShapeMap = { square: 0, circle: 1, star: 2, video: 3 }
    pointFolder.add(data, 'pointShape', pointShapeMap)

    // pointSize
    const pointSizeMap = [0.1, 30]
    pointFolder.add(data, 'pointSize', ...pointSizeMap)

    // line folder
    lineFolder = particleFolder.addFolder('gl.LINE_STRIP')

    // lineShape
    const lineShapeMap = ['line', 'mesh']
    const changeLineShape = () => {
      switch (data.lineShape) {
        case 'mesh':
          vbo = meshPointVBO
          arrayLength = (4 * (POINT_RESOLUTION - 1) + 2) * (POINT_RESOLUTION - 1)
          break
        case 'line':
        default:
          vbo = pointVBO
          arrayLength = POINT_RESOLUTION * POINT_RESOLUTION
      }
    }
    lineFolder.add(data, 'lineShape', lineShapeMap).onChange(changeLineShape)

    // deformation
    const tl = new TimelineMax({
      paused: true
    }).fromTo(
      data,
      0.7,
      {
        deformationProgress: 0
      },
      {
        deformationProgress: 1,
        ease: 'Power2.easeOut'
      }
    )
    const changeDeformation = () => {
      data.deformation ? tl.play() : tl.reverse()
    }
    particleFolder.add(data, 'deformation').onChange(changeDeformation)

    // canvas folder
    const canvasFolder = particleFolder.addFolder('canvas')

    // bgColor
    const bgColorMap = { black: 0, white: 1 }
    const changeBgColor = () => {
      let rgbInt = data.bgColor * 255
      canvas.style.backgroundColor = `rgb(${rgbInt}, ${rgbInt}, ${rgbInt})`
    }
    canvasFolder.add(data, 'bgColor', bgColorMap).onChange(changeBgColor)

    // z position
    const zPositionMap = [MIN_ZOOM, MAX_ZOOM]
    canvasFolder.add(data, 'zPosition', ...zPositionMap).listen()

    // pointer
    const changeMouse = () => {
      if (!data.pointer) {
        pointer = {
          x: 0,
          y: 0
        }
      }
    }
    canvasFolder.add(data, 'pointer').onChange(changeMouse)

    // accel
    canvasFolder.add(data, 'accel')

    // rotation
    canvasFolder.add(data, 'rotation').listen()

    // video folder
    const videoFolder = particleFolder.addFolder('video')

    // capture
    const changeCapture = () => {
      isStop = data.capture ? 1 : 0
      isCapture = data.capture
    }
    videoFolder.add(data, 'capture').onChange(changeCapture)

    // stopMotion
    let timer
    const changeStopMotion = () => {
      isStop = data.stopMotion ? 1 : 0
      if (data.stopMotion) {
        timer = setInterval(() => {
          isCapture = true
        }, 1000 / 3)
      } else {
        clearTimeout(timer)
      }
    }
    videoFolder.add(data, 'stopMotion').onChange(changeStopMotion)

    changeMode()
    changeLineShape()
    changeDeformation()
    changeBgColor()
    changeMouse()
    changeCapture()
    changeStopMotion()
  }

  // Post Effect folder
  {
    postFolder = gui.addFolder('Post Effect')

    // detector
    changeDetector = () => {
      if (data.detector) {
        thumbController.setValue(true)
        detectorMessage.isShow = true
        runDetector()
      } else {
        if (!detector) return

        thumbController.setValue(false)
        detectorMessage.isShow = false
        resetDetector()
        detector = null
      }
    }
    postFolder.add(data, 'detector').onChange(changeDetector)

    // effect
    const effectMap = ['none', 'glitch', 'ykob glitch', 'dot', 'dot screen']
    const changeEffect = () => {
      switch (data.effect) {
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
    }
    postFolder.add(data, 'effect', effectMap).onChange(changeEffect)

    changeEffect()
  }

  // video folder
  const videoFolder = gui.addFolder('video')
  videoFolder.open()

  // video
  const changeVideo = async () => {
    video = await media.getUserMedia({ video: data.video })
    if (!Object.keys(media.videoDevices).some(key => data.video === media.videoDevices[key])) {
      videoController.setValue(getFirstValue(media.videoDevices))
    }

    webcam = new Webcam(video)
    // await webcam.setup()
    webcam.adjustVideoSize(video.videoWidth || video.naturalWidth, video.videoHeight || video.naturalHeight)

    if (detector) {
      resetDetector()
      runDetector()
    }
  }
  videoController = videoFolder.add(data, 'video', media.videoDevices).onChange(changeVideo)

  // videoZoom
  const videoZoomMap = [1, 3]
  videoFolder.add(data, 'videoZoom', ...videoZoomMap)

  // thumb
  const changeThumb = () => {
    media.toggleThumb(data.thumb)
  }
  thumbController = videoFolder.add(data, 'thumb').onChange(changeThumb)

  // audio folder
  const audioFolder = gui.addFolder('audio')
  audioFolder.open()

  // inputAudio
  const changeInputAudio = () => {
    isAudio = data.inputAudio ? 1 : 0
  }
  audioFolder.add(data, 'inputAudio').onChange(changeInputAudio)

  // audio
  const changeAudio = async () => {
    await media.getUserMedia({ audio: data.audio })
    if (!Object.keys(media.audioDevices).some(key => data.audio === media.audioDevices[key])) {
      audioController.setValue(getFirstValue(media.audioDevices))
    }
  }
  const audioController = audioFolder.add(data, 'audio', media.audioDevices).onChange(changeAudio)

  changeScene()
  changeThumb()
  changeInputAudio()
  changeAudio()
  await changeVideo()
  changeDetector()

  cameraPosition.z = data.zPosition

  ipcRenderer.send('dispatch-particles-js', 'initParticlesJs', configs)

  ipcRenderer.once('receive-particles-js', (event, pJS) => {
    // const gui = new dat.GUI({
    //   autoPlace: true,
    //   closed: true,
    //   width: 340
    // })

    // p.update = function () {
    //   // ipcRenderer.send('dispatch-particles-js', 'updateParticlesJs', pJS_GUI)
    // }
  })
};
