<template lang="pug">
.thumb(v-show="isShow", :style="thumbStyle")
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

const THUMB_HEIGHT = 312

export default {
  data: () => ({
    isShow: false,
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
    }
  },
  mounted () {
    ipcRenderer.on('receive-media', (event, media) => {
      const updateMedia = async (sources) => {
        await controlMedia.getUserMedia(sources)

        // add thumbnail
        const thumb = controlMedia.currentVideo
        this.$el.textContent = null
        thumb.classList.add('thumb_video')
        this.$el.appendChild(thumb)
      }

      // init thumbnail
      const controlMedia = new ControlMedia(VIDEO_RESOLUTION, POINT_RESOLUTION, media)
      updateMedia()

      // init gui
      const gui = new dat.GUI({
        closed: true
      })
      gui.close()
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
        settings.thumb = false
        videoFolder.add(settings, 'thumb').onChange(dispatchMedia)

        // Detector folder
        {
          const detectorFolder = videoFolder.addFolder('Detector')
          detectorFolder.open()

          // detector
          settings.detector = false
          detectorFolder.add(settings, 'detector').onChange(dispatchMedia)

          // detect
          settings.detect = () => {
            console.log('detect')
          }
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
      function dispatchMedia (value) {
        ipcRenderer.send('dispatch-media', this.property, value)

        switch (this.property) {
          case 'video':
          case 'audio':
            updateMedia({
              [this.property]: value
            })
            break
          case 'thumb':
            self.isShow = value
            break
        }
      }

      this.$store.watch(this.$store.getters.zoom, videoZoom => {
        settings.videoZoom = videoZoom
        ipcRenderer.send('dispatch-media', 'videoZoom', videoZoom)
      })
      this.$store.watch(this.$store.getters.alpha, videoAlpha => {
        settings.videoAlpha = videoAlpha
        ipcRenderer.send('dispatch-media', 'videoAlpha', videoAlpha)
      })
      this.$store.watch(this.$store.getters.inputAudio, inputAudio => {
        settings.inputAudio = inputAudio
        ipcRenderer.send('dispatch-media', 'inputAudio', inputAudio)
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
    this.$el.addEventListener('pointerdown', e => {
      this.isDown = true

      sendPointer(e)
    })
    this.$el.addEventListener('pointermove', e => {
      if (!this.isDown) return

      sendPointer(e)
    })
    this.$el.addEventListener('pointerup', e => {
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

  &_video:not(.md-image) {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}
</style>
