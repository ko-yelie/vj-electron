<template lang="pug">
#particles-js
</template>

<script>
import { ipcRenderer } from 'electron'
import '../../../node_modules/particles.js/particles.js'

export default {
  mounted () {
    let pJS

    const actions = {
      initParticlesJs: (configJson) => {
        window.particlesJS(
          'particles-js',
          configJson
        )
        pJS = window.pJSDom[0].pJS

        ipcRenderer.send('receive-particles-js', pJS)
      },
      updateParticlesJs: (pJSGui) => {
        Object.assign(pJS, pJSGui)
        pJS.fn.particlesRefresh()
      }
    }

    ipcRenderer.on('dispatch-particles-js', (event, typeName, ...payload) => {
      actions[typeName](...payload)
    })
  }
}
</script>
