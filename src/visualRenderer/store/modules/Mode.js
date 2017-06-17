export default {
  state: {
    mode: 'start'
  },
  mutations: {
    MODE_CONTROL (state) {
      state.mode = 'control'
    },
    MODE_VISUAL (state) {
      state.mode = 'visual'
    }
  },
  actions: {
    control ({ commit }) {
      commit('MODE_CONTROL')
    },
    visual ({ commit }) {
      commit('MODE_VISUAL')
    }
  }
}
