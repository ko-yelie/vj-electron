<template lang="pug">
.thumb(v-show="isShow", :style="elStyle")
  .thumb_wrapper(ref="wrapper", :style="thumbStyle")
  .rect_wrapper(ref="rectWrapper", :style="rectWrapperStyle")
  .detector(v-show="isShowDetectorMessage")
    p.progress(v-if='!isReady') Loading model...
    p.done(v-else) Click to detect!
</template>

<script>
import { ipcRenderer } from 'electron'
import dat from 'dat.gui'

import { getFirstValue } from '../../../visualRenderer/webcamParticle/script/utils.js'
import Media from '../../../visualRenderer/modules/media.js'
import {
  VIDEO_RESOLUTION,
  POINT_RESOLUTION
} from '../../../visualRenderer/webcamParticle/script/modules/constant.js'
import Detector from '../../../visualRenderer/webcamParticle/script/detector.js'

const THUMB_HEIGHT = 416

class ControlMedia extends Media {
  constructor (size, pointResolution, media) {
    super(size, pointResolution)

    ;[
      'videoDevices',
      'audioDevices',
      'videoSource',
      'audioSource',
      'smartphone'
    ].forEach(key => {
      this[key] = media[key]
    })
  }
}

export default {
  data: () => ({
    isShow: false,
    isShowDetectorMessage: false,
    isReady: false,
    windowSize: {
      width: 1024,
      height: 768
    }
  }),
  computed: {
    thumbSize () {
      return {
        width: this.windowSize.width * THUMB_HEIGHT / this.windowSize.height,
        height: THUMB_HEIGHT
      }
    },
    thumbStyle () {
      return {
        width: this.thumbSize.width + 'px',
        height: this.thumbSize.height + 'px'
      }
    },
    elStyle () {
      return {
        height: THUMB_HEIGHT + 'px'
      }
    },
    rectWrapperStyle () {
      return {
        width: THUMB_HEIGHT + 'px',
        height: THUMB_HEIGHT + 'px'
      }
    }
  },
  mounted () {
    ipcRenderer.on('receive-media', (event, media) => {
      const updateMedia = async (sources) => {
        await controlMedia.getUserMedia(sources)

        // add thumbnail
        const thumb = controlMedia.currentVideo
        this.$refs.wrapper.textContent = null
        thumb.classList.add('thumb_video')
        this.$refs.wrapper.appendChild(thumb)
        thumb.play()
      }

      // init thumbnail
      const controlMedia = new ControlMedia(VIDEO_RESOLUTION, POINT_RESOLUTION, media)
      updateMedia()

      // init gui
      const gui = new dat.GUI()
      const settings = {}

      // video folder
      {
        const videoFolder = gui.addFolder('video')
        videoFolder.open()

        // video
        settings.video = controlMedia.videoSource
        const videoController = videoFolder.add(settings, 'video', controlMedia.videoDevices).onChange(dispatchMedia)
        if (!Object.keys(controlMedia.videoDevices).some(key => settings.video === controlMedia.videoDevices[key])) {
          videoController.setValue(getFirstValue(controlMedia.videoDevices))
        }

        // videoZoom
        const videoZoomMap = [1, 3]
        settings.videoZoom = 1
        videoFolder.add(settings, 'videoZoom', ...videoZoomMap).onChange(dispatchMedia).listen()

        // videoAlpha
        const videoAlphaMap = [0, 1]
        settings.videoAlpha = 1
        videoFolder.add(settings, 'videoAlpha', ...videoAlphaMap).onChange(dispatchMedia).listen()

        // thumb
        settings.thumb = true
        videoFolder.add(settings, 'thumb').onChange(dispatchMedia)
        this.isShow = settings.thumb

        // Detector folder
        {
          const detectorFolder = videoFolder.addFolder('Detector')
          detectorFolder.open()

          // detector
          settings.detector = false
          detectorFolder.add(settings, 'detector').onChange(dispatchMedia)

          // detect
          settings.detect = () => {}
          detectorFolder.add(settings, 'detect').onChange(dispatchMedia)
        }
      }

      // audio folder
      {
        const audioFolder = gui.addFolder('audio')
        audioFolder.open()

        // inputAudio
        settings.inputAudio = false
        audioFolder.add(settings, 'inputAudio').onChange(dispatchMedia).listen()

        // audio
        settings.audio = controlMedia.audioSource
        const audioController = audioFolder.add(settings, 'audio', controlMedia.audioDevices).onChange(dispatchMedia)
        if (!Object.keys(controlMedia.audioDevices).some(key => settings.audio === controlMedia.audioDevices[key])) {
          audioController.setValue(getFirstValue(controlMedia.audioDevices))
        }
      }

      const self = this
      async function dispatchMedia (value) {
        switch (this.property) {
          case 'video':
            await updateMedia({
              video: value
            })
            ipcRenderer.send('dispatch-media', 'detect', resetDetector())
            ipcRenderer.send('dispatch-media', 'detect', await detect())
            break
          case 'audio':
            updateMedia({
              audio: value
            })
            break
          case 'thumb':
            self.isShow = value
            break
          case 'detector':
            ipcRenderer.send('dispatch-media', 'detect', value ? await runDetector() : resetDetector())
            break
          case 'detect':
            value = await detect()
            break
        }

        ipcRenderer.send('dispatch-media', this.property, value)
      }

      const runDetector = async () => {
        this.isShowDetectorMessage = true
        resetDetector()
        this.detector = new Detector(controlMedia.webcam, this.$refs.rectWrapper)
        await this.detector.promise
        this.isReady = true
        return detect()
      }

      const detect = async () => {
        if (!settings.detector || !this.detector) return []

        await this.detector.detect()
        return this.detector.posList
      }

      const resetDetector = () => {
        if (!this.detector) return []

        this.detector.reset()
        this.isReady = false
        this.isShowDetectorMessage = false
        return this.detector.posList
      }

      ;[
        'videoZoom',
        'videoAlpha',
        'inputAudio'
      ].forEach(property => {
        this.$store.watch(this.$store.getters[property], value => {
          settings[property] = value
          ipcRenderer.send('dispatch-media', property, value)
        })
      })
    })

    // pointer
    const sendPointer = e => {
      let x = e.offsetX / this.thumbSize.width * 2.0 - 1.0
      let y = e.offsetY / this.thumbSize.height * 2.0 - 1.0
      ipcRenderer.send('dispatch-webcam-particle', 'update', 'pointerPosition', {
        x,
        y: -y
      })
    }
    this.$refs.wrapper.addEventListener('pointerdown', e => {
      this.isDown = true

      sendPointer(e)
    })
    this.$refs.wrapper.addEventListener('pointermove', e => {
      if (!this.isDown) return

      sendPointer(e)
    })
    this.$refs.wrapper.addEventListener('pointerup', e => {
      this.isDown = false
    })

    // window size
    ipcRenderer.on('receive-window', (event, windowSize) => {
      this.windowSize = windowSize
    })
  }
}
</script>

<style lang="scss">
.thumb {
  overflow: hidden;
  position: relative;
  background-color: #000;

  &_wrapper {
    position: relative;
    margin: auto;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      border: dashed 1px rgba(white, 0.5);
    }
  }

  &_video:not(.md-image) {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}

.rect {
  position: absolute;
  z-index: 1;
  border: 1px solid red;
  font-size: 24px;

  &_wrapper {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    margin: auto;
    pointer-events: none;
  }

  .label {
    position: absolute;
    right: 0;
    bottom: 0;
    background: rgba(white, 0.4);
    color: #333;
    font-size: 10px;
    padding: 0 2px;
    text-transform: capitalize;
    white-space: nowrap;
  }

  &.o-blue {
    opacity: 0.5;
    z-index: auto;
    border-color: blue;
  }
}

.detector {
  position: absolute;
  right: 0;
  bottom: 0;
  color: #ddd;

  p {
    margin: 1em;
  }
}
.progress {
  animation: loading 1000ms infinite;
}
@keyframes loading {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
