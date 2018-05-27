import { ipcRenderer } from 'electron'
import dat from 'dat.gui'

import json from '../../assets/json/js/webcamParticle/scene.json'

const MIN_ZOOM = 2
const MAX_ZOOM = 10

const ANIMATION_NORMAL = 0
const ANIMATION_WARP = 1

const POINTS = 0
const LINE_STRIP = 1
const TRIANGLES = 3

export default async function (argConfig, store) {
  const config = argConfig || json
  const preset = location.search.substring(1) || config.preset
  const gui = new dat.GUI({
    load: config,
    preset: preset
  })
  let particleFolder
  let pointFolder
  let lineFolder
  let postFolder
  // let thumbController

  const settings = config.remembered[preset][0]
  gui.remember(settings)

  // scene
  const sceneMap = ['none', 'Post Effect', 'Particle', 'Pop']
  gui.add(settings, 'scene', sceneMap).onChange(dispatchVisual)

  // Post Effect folder
  {
    postFolder = gui.addFolder('Post Effect')
    postFolder.open()

    // detector
    postFolder.add(settings, 'detector').onChange(dispatchVisual)

    // effect
    const effectMap = ['none', 'glitch', 'ykob glitch', 'dot', 'dot screen']
    postFolder.add(settings, 'effect', effectMap).onChange(dispatchVisual)
    postFolder.add(settings, 'lastEffect', effectMap).onChange(dispatchVisual)
  }

  // Particle folder
  {
    particleFolder = gui.addFolder('Particle')

    // animation
    const animationMap = { normal: ANIMATION_NORMAL, warp: ANIMATION_WARP }
    particleFolder.add(settings, 'animation', animationMap).onChange(dispatchVisual)

    // mode
    const modeMap = {
      'gl.POINTS': POINTS,
      'gl.LINE_STRIP': LINE_STRIP,
      'gl.TRIANGLES': TRIANGLES
    }
    particleFolder.add(settings, 'mode', modeMap).onChange(dispatchVisual)

    // point folder
    pointFolder = particleFolder.addFolder('gl.POINTS')

    // pointShape
    const pointShapeMap = { square: 0, circle: 1, star: 2, video: 3 }
    pointFolder.add(settings, 'pointShape', pointShapeMap).onChange(dispatchVisual)

    // pointSize
    const pointSizeMap = [0.1, 30]
    pointFolder.add(settings, 'pointSize', ...pointSizeMap).onChange(dispatchVisual)

    // line folder
    lineFolder = particleFolder.addFolder('gl.LINE_STRIP')

    // lineShape
    const lineShapeMap = ['line', 'mesh']
    lineFolder.add(settings, 'lineShape', lineShapeMap).onChange(dispatchVisual)

    // deformation
    particleFolder.add(settings, 'deformation').onChange(dispatchVisual)

    // canvas folder
    const canvasFolder = particleFolder.addFolder('canvas')

    // bgColor
    const bgColorMap = { black: 0, white: 1 }
    canvasFolder.add(settings, 'bgColor', bgColorMap).onChange(dispatchVisual)

    // z position
    const zPositionMap = [MIN_ZOOM, MAX_ZOOM]
    canvasFolder.add(settings, 'zPosition', ...zPositionMap).listen().onChange(dispatchVisual)

    // pointer
    canvasFolder.add(settings, 'pointer').onChange(dispatchVisual)

    // accel
    canvasFolder.add(settings, 'accel').onChange(dispatchVisual)

    // rotation
    canvasFolder.add(settings, 'rotation').listen().onChange(dispatchVisual)

    // video folder
    const videoFolder = particleFolder.addFolder('video')

    // capture
    videoFolder.add(settings, 'capture').onChange(dispatchVisual)

    // stopMotion
    videoFolder.add(settings, 'stopMotion').onChange(dispatchVisual)

    // particleAlpha
    const particleAlphaMap = [0, 1]
    particleFolder.add(settings, 'particleAlpha', ...particleAlphaMap).onChange(dispatchVisual)
  }

  function dispatchVisual (val) {
    ipcRenderer.send('dispatch-webcam-particle', 'update', this.property, val)

    switch (this.property) {
      case 'scene':
        particleFolder.close()

        switch (val) {
          case 'Pop':
            particleFolder.open()
            break
          case 'Particle':
          default:
            particleFolder.open()
        }
        break
      case 'mode':
        pointFolder.close()
        lineFolder.close()

        switch (Number(val)) {
          case LINE_STRIP:
          case TRIANGLES:
            lineFolder.open()
            break
          case POINTS:
          default:
            pointFolder.open()
        }
        break
      case 'detector':
        // if (val) {
        //   thumbController.setValue(true)
        // } else {
        //   thumbController.setValue(false)
        // }
        break
    }
  }

  // media folder
  {
    const mediaFolder = gui.addFolder('media')

    // videoZoom
    const videoZoomMap = [1, 3]
    settings.videoZoom = 1
    mediaFolder.add(settings, 'videoZoom', ...videoZoomMap).onChange(dispatchMedia)

    // videoAlpha
    const videoAlphaMap = [0, 1]
    settings.videoAlpha = 1
    mediaFolder.add(settings, 'videoAlpha', ...videoAlphaMap).onChange(dispatchMedia)

    // inputAudio
    settings.inputAudio = false
    mediaFolder.add(settings, 'inputAudio').onChange(dispatchMedia)
  }

  function dispatchMedia (value) {
    switch (this.property) {
      case 'videoZoom':
        store.commit('UPDATE_ZOOM', settings.videoZoom)
        break
      case 'videoAlpha':
        store.commit('UPDATE_ALPHA', settings.videoAlpha)
        break
      case 'inputAudio':
        store.commit('UPDATE_INPUT_AUDIO', settings.inputAudio)
        break
    }
  }

  ipcRenderer.send('dispatch-webcam-particle', 'init', settings)
}
