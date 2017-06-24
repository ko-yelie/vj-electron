<script>
import { mapState } from 'vuex'
import draggable from 'vuedraggable'

import VjVideo from './LandingPage/VjVideo'

export default {
  name: 'landing-page',
  components: {
    draggable,
    VjVideo
  },
  computed: {
    ...mapState({
    }),
    videos: {
      get () {
        return this.$store.state.Video.videos
      },
      set (videos) {
        this.$store.dispatch('updateVideos', videos)
      }
    },
    displayingVideos: {
      get () {
        return this.$store.state.Video.displayingVideos
      },
      set (displayingVideos) {
        this.$store.dispatch('updateDisplayingVideos', displayingVideos)
      }
    }
  },
  methods: {
    addDisplayingVideo (evt) {
      this.$store.dispatch('addDisplayingVideo', evt.item._underlying_vm_)
    },
    updateDisplayingVideosOrder () {
      this.$store.dispatch('updateDisplayingVideosOrder')
    }
  }
}
</script>
<template lang="pug" src="./LandingPage.pug"></template>
<style lang="scss" src="./LandingPage.scss"></style>
