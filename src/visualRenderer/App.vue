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
    this.$store.subscribe((mutation, state) => {
      switch (mutation.type) {
        case 'ADD_DISPLAYING_VIDEO':
          const addedVideo = mutation.payload
          const addedComponent = new VjVideo({
            propsData: {
              video: addedVideo
            }
          }).$mount()
          this.$el.appendChild(addedComponent.$el)

          this.components[addedVideo.id] = addedComponent
          break
        case 'UPDATE_DISPLAYING_VIDEOS_ORDER':
          const displayingVideos = mutation.payload
          displayingVideos.forEach((video, index) => {
            this.components[video.id].video.order = video.order
          })
          break
        case 'UPDATE_OPACITY':
          const video = mutation.payload
          this.components[video.id].video.opacity = video.opacity
          break
        case 'REMOVE_DISPLAYING_VIDEO':
          const removedVideo = mutation.payload
          this.$el.removeChild(this.components[removedVideo.id].$el)
          delete this.components[removedVideo.id]
          break
      }
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
