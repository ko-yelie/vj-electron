<template lang="pug">
#particles-js
</template>

<script>
import { ipcRenderer } from 'electron'
import 'particles.js/particles.js'

function mounted () {
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

export default {
  mounted
}
</script>
