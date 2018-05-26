export default {
  state: {
    media: null,
    zoom: null,
    inputAudio: null
  },
  mutations: {
    UPDATE_MEDIA (state, media) {
      state.media = media
    },
    UPDATE_ZOOM (state, zoom) {
      state.zoom = zoom
    },
    UPDATE_INPUT_AUDIO (state, inputAudio) {
      state.inputAudio = inputAudio
    }
  },
  getters: {
    media: state => () => state.media,
    zoom: state => () => state.zoom,
    inputAudio: state => () => state.inputAudio
  }
}
