<script>
import draggable from 'vuedraggable'
import { mapActions } from 'vuex'

import VjDisplayingVideo from './LandingPage/VjDisplayingVideo'
import VjThumb from './LandingPage/VjThumb'

let displayingVideosCache = []

export default {
  name: 'landing-page',
  components: {
    draggable,
    VjDisplayingVideo,
    VjThumb
  },
  computed: {
    visualStock: {
      get () {
        return this.$store.state.Video.visualStock
      },
      set (visualStock) {
        this.$store.dispatch('updateVideos', visualStock)
      }
    },
    displayingVideos: {
      get () {
        return this.$store.state.Video.displayingVideos
      },
      set (displayingVideos) {
        displayingVideosCache = displayingVideos
      }
    }
  },
  methods: {
    changeDisplayingVideos (evt) {
      this.$store.dispatch('updateDisplayingVideos', displayingVideosCache)
      this.$store.dispatch('changeDisplayingVideos', evt)
    },
    ...mapActions([
      'refresh'
    ])
  }
}
</script>
<template lang="pug" src="./LandingPage.pug"></template>
<style lang="scss" src="./LandingPage.scss"></style>
