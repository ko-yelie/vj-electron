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
    thumbSize () {
      return {
        width: this.windowSize.width * THUMB_HEIGHT / this.windowSize.height,
        height: THUMB_HEIGHT
      }
    },
    thumbStyle () {
      return {
        width: this.thumbSize.width + 'px',
        height: this.thumbSize.height + 'px'
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
    const sendPointer = e => {
      let x = e.offsetX / this.thumbSize.width * 2.0 - 1.0
      let y = e.offsetY / this.thumbSize.height * 2.0 - 1.0
      ipcRenderer.send('dispatch-webcam-particle', 'update', 'pointerPosition', {
        x,
        y: -y
      })
    }
    this.$el.addEventListener('pointerdown', e => {
      this.isDown = true

      sendPointer(e)
    })
    this.$el.addEventListener('pointermove', e => {
      if (!this.isDown) return

      sendPointer(e)
    })
    this.$el.addEventListener('pointerup', e => {
      this.isDown = false
    })

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
