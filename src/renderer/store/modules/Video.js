import { ipcRenderer } from 'electron'

const videos = [
  {
    id: 'AovB1kid35o',
    title: 'AOKI takamasa // rhythm variation 06'
  },
  {
    id: 'ZQ1zjPqJBPQ',
    title: 'Alva Noto + Opiate - Opto File 2 - 2001'
  }
]

export default {
  state: {
    activeId: videos[0].id,
    videos
  },
  mutations: {
    CHANGE_ACTIVE_ID (state, video) {
      state.activeId = video.id
      ipcRenderer.send('dispatch-connect', 'changeActiveId', video)
    }
  },
  actions: {
    changeActiveId ({ commit }, video) {
      commit('CHANGE_ACTIVE_ID', video)
    }
  }
}
