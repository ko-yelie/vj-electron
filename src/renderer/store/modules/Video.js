import { ipcRenderer } from 'electron'

const videoData = [
  {
    id: 'AovB1kid35o',
    title: 'AOKI takamasa // rhythm variation 06'
  },
  {
    id: 'ZQ1zjPqJBPQ',
    title: 'Alva Noto + Opiate - Opto File 2 - 2001'
  }
]
const videos = videoData.map(({ id, title }) => ({
  id,
  title,
  thumbnail: 'http://i.ytimg.com/vi/' + id + '/default.jpg',
  opacity: 1
}))

export default {
  state: {
    videos,
    displayingVideos: []
  },
  mutations: {
    UPDATE_VIDEOS (state, videos) {
      state.videos = videos
    },
    UPDATE_DISPLAYING_VIDEOS (state, displayingVideos) {
      state.displayingVideos = displayingVideos
    },
    UPDATE_OPACITY (state, { video, opacity }) {
      video.opacity = opacity
    }
  },
  actions: {
    updateVideos ({ commit }, videos) {
      commit('UPDATE_VIDEOS', videos)
    },
    updateDisplayingVideos ({ commit, state }, displayingVideos) {
      commit('UPDATE_DISPLAYING_VIDEOS', displayingVideos)

      ipcRenderer.send('dispatch-connect', 'updateDisplayingVideos', state.displayingVideos)
    },
    updateOpacity ({ commit, state }, payload) {
      commit('UPDATE_OPACITY', payload)

      ipcRenderer.send('dispatch-connect', 'updateDisplayingVideos', state.displayingVideos)
    }
  }
}
