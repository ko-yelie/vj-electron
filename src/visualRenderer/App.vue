<script>
import { ipcRenderer } from 'electron'
import Vue from 'vue'

import VjVisualComponent from './components/VjVisual'
import Media from './store/media.js'
import { Webcam } from './webcamParticle/script/webcam.js'

const POINT_RESOLUTION = 128
const VIDEO_RESOLUTION = 416

const VjVisual = Vue.extend(VjVisualComponent)

export default {
  name: 'visual-page',
  data () {
    return {
      components: {}
    }
  },
  mounted () {
    const media = new Media(VIDEO_RESOLUTION, POINT_RESOLUTION)
    media.enumerateDevices().then(async () => {
      const updateMedia = async sources => {
        const video = await media.getUserMedia(sources)

        const webcam = new Webcam(video)
        // await webcam.setup()
        webcam.adjustVideoSize(video.videoWidth || video.naturalWidth, video.videoHeight || video.naturalHeight)
      }

      await updateMedia()
      this.$store.commit('UPDATE_MEDIA', media)

      ipcRenderer.on('dispatch-media', async (event, property, value) => {
        switch (property) {
          case 'video':
          case 'audio':
            await updateMedia({
              [property]: value
            })
            this.$store.commit('UPDATE_MEDIA', media)
            break
          case 'videoZoom':
            this.$store.commit('UPDATE_ZOOM', value)
            break
          case 'inputAudio':
            this.$store.commit('UPDATE_INPUT_AUDIO', value)
            break
        }
      })

      ipcRenderer.send('receive-media', media)

      const actions = {
        addDisplayingVideo: (visual) => {
          const addedComponent = new VjVisual({
            propsData: { visual },
            store: this.$store
          }).$mount()
          this.$el.appendChild(addedComponent.$el)

          this.components[visual.id] = addedComponent
        },
        updateDisplayingVideosOrder: (displayingVideos) => {
          displayingVideos.forEach((visual, index) => {
            this.components[visual.id].order = index
          })
        },
        updateOpacity: (visual) => {
          this.components[visual.id].visual.opacity = visual.opacity
        },
        removeDisplayingVideo: (visual) => {
          this.$el.removeChild(this.components[visual.id].$el)
          delete this.components[visual.id]
        },
        refresh () {
          location.reload()
        }
      }

      ipcRenderer.on('dispatch-connect', (event, typeName, ...payload) => {
        actions[typeName](...payload)
      })
    })
  }
}
</script>

<template lang="pug">
.view
</template>

<style lang="scss">
body {
  margin: 0;
}

.view {
  overflow: hidden;
  position: relative;
  width: 100vw;
  height: 100vh;
  cursor: none;
}
</style>
