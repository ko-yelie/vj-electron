<script>
import { ipcRenderer } from 'electron'
import Vue from 'vue'

import VjVideoOpsions from './components/VjVideo'

const VjVideo = Vue.extend(VjVideoOpsions)

export default {
  name: 'visual-page',
  data () {
    return {
      components: {}
    }
  },
  mounted () {
    const actions = {
      addDisplayingVideo: (video) => {
        const addedComponent = new VjVideo({
          propsData: { video }
        }).$mount()
        this.$el.appendChild(addedComponent.$el)

        this.components[video.id] = addedComponent
      },
      updateDisplayingVideosOrder: (displayingVideos) => {
        displayingVideos.forEach((video, index) => {
          this.components[video.id].order = index
        })
      },
      updateOpacity: (video) => {
        this.components[video.id].video.opacity = video.opacity
      },
      removeDisplayingVideo: (video) => {
        this.$el.removeChild(this.components[video.id].$el)
        delete this.components[video.id]
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
  background: #000;
}

.view {
  position: relative;
  width: 100vw;
  height: 100vh;
}
</style>
