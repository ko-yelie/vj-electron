<template lang="pug">
div
  canvas(ref="canvas")

  .thumb(ref="videoWrapper")
    //- img.video(src="http://your.ip.address:8080/video", crossorigin="anonymous")#smartphone
</template>

<script>
import { ipcRenderer } from 'electron'
import webcamParticle from '../webcamParticle/script/index.js'

export default {
  mounted () {
    webcamParticle({
      el: this.$el,
      canvas: this.$refs.canvas,
      videoWrapper: this.$refs.videoWrapper
    })

    const actions = {
      initParticlesJs: (configJson) => {
        // ipcRenderer.send('receive-particles-js', pJS)
      },
      updateParticlesJs: (data) => {
        console.log(data)
      }
    }

    ipcRenderer.on('dispatch-particles-js', (event, typeName, ...payload) => {
      actions[typeName](...payload)
    })
  }
}
</script>
