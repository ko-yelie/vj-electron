export default {
  state: {
    zoom: null,
    alpha: null,
    inputAudio: null
  },
  mutations: {
    UPDATE_ZOOM (state, zoom) {
      state.zoom = zoom
    },
    UPDATE_ALPHA (state, alpha) {
      state.alpha = alpha
    },
    UPDATE_INPUT_AUDIO (state, inputAudio) {
      state.inputAudio = inputAudio
    }
  },
  getters: {
    zoom: state => () => state.zoom,
    alpha: state => () => state.alpha,
    inputAudio: state => () => state.inputAudio
  }
}
