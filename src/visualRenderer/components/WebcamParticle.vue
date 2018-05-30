<template lang="pug">
canvas
</template>

<script>
import { ipcRenderer } from 'electron'

import {
  run,
  stop,
  start,
  update,
  updateVideo,
  updateZoom,
  updateAlpha,
  updateFocusPosList,
  updateInputAudio
} from '../webcamParticle/script/script.js'
import Media from '../modules/media.js'
import {
  VIDEO_RESOLUTION,
  POINT_RESOLUTION
} from '../webcamParticle/script/modules/constant.js'

let isDirty = false

export default {
  mounted () {
    if (isDirty) {
      start()
      return
    }
    isDirty = true

    const media = new Media(VIDEO_RESOLUTION, POINT_RESOLUTION)
    media.enumerateDevices().then(async () => {
      await media.getUserMedia()

      run({
        canvas: this.$el,
        settings: this.settings,
        media: media
      })

      ipcRenderer.on('dispatch-media', async (event, property, value) => {
        switch (property) {
          case 'video':
            const video = await media.getUserMedia({
              video: value
            })
            updateVideo(video)
            break
          case 'audio':
            media.getUserMedia({
              audio: value
            })
            break
          case 'videoZoom':
            updateZoom(value)
            break
          case 'videoAlpha':
            updateAlpha(value)
            break
          case 'detect':
            updateFocusPosList(value)
            break
          case 'inputAudio':
            updateInputAudio(value)
            break
        }
      })

      ipcRenderer.send('receive-media', media)
    })

    const actions = {
      init: (settings) => {
        this.settings = settings
      },
      update: (property, value) => {
        update(property, value)
      }
    }

    ipcRenderer.on('dispatch-webcam-particle', (event, typeName, ...payload) => {
      actions[typeName](...payload)
    })
  },
  beforeDestroy () {
    stop()
  }
}
</script>
