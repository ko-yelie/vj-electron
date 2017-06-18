<template lang="pug">
iframe.visual-frame(width="1024", height="768", :src="'https://www.youtube.com/embed/' + activeId + '?showinfo=0&rel=0&controls=0&fs=0&iv_load_policy=3&loop=1&autoplay=1'", frameborder="0", allowfullscreen="")
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'visual-page',
  computed: mapState({
    activeId: state => state.activeId
  }),
  methods: {
    changeActiveId (video) {
      this.$store.dispatch('changeActiveId', video)
    }
  }
}
</script>

<style>
body {
  margin: 0;
}

.visual-frame {
  object-fit: cover;
  width: 100vw;
  height: 100vh;
}
</style>
