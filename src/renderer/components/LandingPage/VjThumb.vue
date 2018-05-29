<template lang="pug">
.thumb(ref="thumb", v-show="isShow", :style="thumbStyle")
</template>

<script>
import { ipcRenderer } from 'electron'

const THUMB_HEIGHT = 312

export default {
  props: ['el', 'isShow'],
  data: () => ({
    windowSize: {
      width: 1024,
      height: 768
    }
  }),
  computed: {
    thumbStyle () {
      return {
        width: this.windowSize.width * THUMB_HEIGHT / this.windowSize.height + 'px',
        height: THUMB_HEIGHT + 'px'
      }
    }
  },
  watch: {
    el () {
      // add thumbnail
      this.$el.textContent = null
      this.el.classList.add('thumb_video')
      this.$el.appendChild(this.el)
    }
  },
  mounted () {
    ipcRenderer.on('receive-window', (event, windowSize) => {
      this.windowSize = windowSize
    })
  }
}
</script>

<style lang="scss">
.thumb {
  position: relative;
  margin: auto;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    border: dashed 1px rgba(white, 0.5);
  }

  &_video:not(.md-image) {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}
</style>
