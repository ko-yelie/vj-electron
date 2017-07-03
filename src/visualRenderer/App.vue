<script>
import { ipcRenderer } from 'electron'
import Vue from 'vue'

import VjVisualComponent from './components/VjVisual'

const VjVisual = Vue.extend(VjVisualComponent)

export default {
  name: 'visual-page',
  data () {
    return {
      components: {}
    }
  },
  mounted () {
    const actions = {
      addDisplayingVideo: (visual) => {
        const addedComponent = new VjVisual({
          propsData: { visual }
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
