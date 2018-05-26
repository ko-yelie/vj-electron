<script>
import { ipcRenderer } from 'electron'
import draggable from 'vuedraggable'
import { mapActions } from 'vuex'
import dat from 'dat.gui'

import VjDisplayingVideo from './LandingPage/VjDisplayingVideo'
import { getFirstValue } from '../../visualRenderer/webcamParticle/script/utils.js'

let displayingVideosCache = []

export default {
  name: 'landing-page',
  components: {
    draggable,
    VjDisplayingVideo
  },
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
    ipcRenderer.on('receive-media', (event, media) => {
      const gui = new dat.GUI({
        closed: true,
        hideable: true
      })
      const settings = {}

      // video folder
      const videoFolder = gui.addFolder('video')
      videoFolder.open()

      // video
      settings.video = getFirstValue(media.videoDevices)
      const videoController = videoFolder.add(settings, 'video', media.videoDevices).onChange(dispatchMedia)
      if (!Object.keys(media.videoDevices).some(key => settings.video === media.videoDevices[key])) {
        videoController.setValue(getFirstValue(media.videoDevices))
      }

      // videoZoom
      const videoZoomMap = [1, 3]
      settings.videoZoom = videoZoomMap[0]
      videoFolder.add(settings, 'videoZoom', ...videoZoomMap).onChange(dispatchMedia)

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
      settings.audio = getFirstValue(media.audioDevices)
      const audioController = audioFolder.add(settings, 'audio', media.audioDevices).onChange(dispatchMedia)
      if (!Object.keys(media.audioDevices).some(key => settings.audio === media.audioDevices[key])) {
        audioController.setValue(getFirstValue(media.audioDevices))
      }

      function dispatchMedia (val) {
        ipcRenderer.send('dispatch-media', this.property, val)
      }
    })
  }
}
</script>
<template lang="pug" src="./LandingPage.pug"></template>
<style lang="scss" src="./LandingPage.scss"></style>
