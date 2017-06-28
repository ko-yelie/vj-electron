<template lang="pug">
#particles-js(
  :style="{ 'z-index': order, opacity: visual.opacity }"
)
</template>

<script>
import '../../../node_modules/particles.js/particles.js'
import loadGUI from './particlesJsGui.js'

export default {
  props: ['visual', 'order'],
  mounted () {
    window.particlesJS.load(
      'particles-js',
      '/src/renderer/assets/json/js/particlesjs-config.json',
      loadGUI
    )
  }
}
</script>
