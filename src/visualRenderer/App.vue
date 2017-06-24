<script>
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
    const methods = {
      ADD_DISPLAYING_VIDEO: (video) => {
        const addedComponent = new VjVideo({
          propsData: { video }
        }).$mount()
        this.$el.appendChild(addedComponent.$el)

        this.components[video.id] = addedComponent
      },
      UPDATE_DISPLAYING_VIDEOS_ORDER: (displayingVideos) => {
        displayingVideos.forEach((video, index) => {
          this.components[video.id].order = index
        })
      },
      UPDATE_OPACITY: (video) => {
        this.components[video.id].video.opacity = video.opacity
      },
      REMOVE_DISPLAYING_VIDEO: (video) => {
        this.$el.removeChild(this.components[video.id].$el)
        delete this.components[video.id]
      }
    }

    this.$store.subscribe((mutation) => {
      methods[mutation.type](mutation.payload)
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
