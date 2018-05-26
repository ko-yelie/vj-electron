<template lang="pug">
canvas
</template>

<script>
import { ipcRenderer } from 'electron'
import {
  run,
  stop,
  start,
  update,
  updateMedia,
  updateZoom,
  updateInputAudio
} from '../webcamParticle/script/script.js'

let isDirty = false

export default {
  mounted () {
    if (isDirty) {
      start()
      return
    }
    isDirty = true

    const actions = {
      init: (settings) => {
        run({
          canvas: this.$el,
          settings,
          media: this.$store.state.Media.media
        })
      },
      update: (property, value) => {
        update(property, value)
      }
    }

    ipcRenderer.on('dispatch-webcam-particle', (event, typeName, ...payload) => {
      actions[typeName](...payload)
    })

    this.$store.watch(this.$store.getters.media, media => {
      updateMedia(media)
    })
    this.$store.watch(this.$store.getters.zoom, zoom => {
      updateZoom(zoom)
    })
    this.$store.watch(this.$store.getters.inputAudio, inputAudio => {
      updateInputAudio(inputAudio)
    })
  },
  beforeDestroy () {
    stop()
  }
}
</script>
