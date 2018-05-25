<template lang="pug">
div
  canvas(ref="canvas")
</template>

<script>
import { ipcRenderer } from 'electron'
import { run, update } from '../webcamParticle/script/script.js'

export default {
  mounted () {
    const actions = {
      init: (settings) => {
        run({
          el: this.$el,
          canvas: this.$refs.canvas,
          settings
        })
      },
      update: (settings, property) => {
        update(settings, property)
      }
    }

    ipcRenderer.on('dispatch-webcam-particle', (event, typeName, ...payload) => {
      actions[typeName](...payload)
    })
  }
}
</script>
