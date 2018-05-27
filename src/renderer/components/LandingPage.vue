<script>
import { ipcRenderer } from 'electron'
import draggable from 'vuedraggable'
import { mapActions } from 'vuex'
import dat from 'dat.gui'

import VjDisplayingVideo from './LandingPage/VjDisplayingVideo'
import { getFirstValue } from '../../visualRenderer/webcamParticle/script/utils.js'
import Media from '../../visualRenderer/modules/media.js'

const POINT_RESOLUTION = 128
const VIDEO_RESOLUTION = 416

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

let displayingVideosCache = []

export default {
  name: 'landing-page',
  components: {
    draggable,
    VjDisplayingVideo
  },
  data: () => ({
    isThumb: false
  }),
  computed: {
    visualStock: {
      get () {
        return this.$store.state.Video.visualStock
      },
      set (visualStock) {
        this.$store.dispatch('updateVideos', visualStock)
      }
    },
    displayingVideos: {
      get () {
        return this.$store.state.Video.displayingVideos
      },
      set (displayingVideos) {
        displayingVideosCache = displayingVideos
      }
    }
  },
  methods: {
    changeDisplayingVideos (evt) {
      this.$store.dispatch('updateDisplayingVideos', displayingVideosCache)
      this.$store.dispatch('changeDisplayingVideos', evt)
    },
    ...mapActions([
      'refresh'
    ])
  },
  mounted () {
    ipcRenderer.on('receive-media', async (event, media) => {
      const updateMedia = async (sources) => {
        await controlMedia.getUserMedia(sources)

        // add thumbnail
        const thumb = this.$refs.thumb
        thumb.textContent = null
        thumb.appendChild(controlMedia.currentVideo)
      }

      // init thumbnail
      const controlMedia = new ControlMedia(VIDEO_RESOLUTION, POINT_RESOLUTION, media)
      updateMedia()

      // init gui
      const gui = new dat.GUI({
        closed: true,
        hideable: true
      })
      const settings = {}

      // video folder
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
      settings.videoZoom = videoZoomMap[0]
      videoFolder.add(settings, 'videoZoom', ...videoZoomMap).onChange(dispatchMedia)

      // videoAlpha
      const videoAlphaMap = [0, 1]
      settings.videoAlpha = videoAlphaMap[1]
      videoFolder.add(settings, 'videoAlpha', ...videoAlphaMap).onChange(dispatchMedia)

      // thumb
      settings.thumb = false
      videoFolder.add(settings, 'thumb').onChange(dispatchMedia)

      // audio folder
      const audioFolder = gui.addFolder('audio')
      audioFolder.open()

      // inputAudio
      settings.inputAudio = false
      audioFolder.add(settings, 'inputAudio').onChange(dispatchMedia)

      // audio
      settings.audio = controlMedia.audioSource
      const audioController = audioFolder.add(settings, 'audio', controlMedia.audioDevices).onChange(dispatchMedia)
      if (!Object.keys(controlMedia.audioDevices).some(key => settings.audio === controlMedia.audioDevices[key])) {
        audioController.setValue(getFirstValue(controlMedia.audioDevices))
      }

      const self = this
      async function dispatchMedia (value) {
        ipcRenderer.send('dispatch-media', this.property, value)

        switch (this.property) {
          case 'video':
          case 'audio':
            updateMedia({
              [this.property]: value
            })
            break
          case 'thumb':
            self.isThumb = value
            break
        }
      }
    })
  }
}
</script>
<template lang="pug" src="./LandingPage.pug"></template>
<style lang="scss" src="./LandingPage.scss"></style>
