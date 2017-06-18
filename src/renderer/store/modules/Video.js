export default {
  state: {
    activeId: 'AovB1kid35o',
    videos: [
      {
        id: 'AovB1kid35o',
        title: 'AOKI takamasa // rhythm variation 06'
      },
      {
        id: 'ZQ1zjPqJBPQ',
        title: 'Alva Noto + Opiate - Opto File 2 - 2001'
      }
    ]
  },
  mutations: {
    CHANGE_ACTIVE_ID (state, video) {
      state.activeId = video.id
    }
  },
  actions: {
    changeActiveId ({ commit }, video) {
      commit('CHANGE_ACTIVE_ID', video)
    }
  }
}
