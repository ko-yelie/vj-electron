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
      ipcRenderer.send('dispatch-connect', 'updateVideos', videos)
    },
    UPDATE_DISPLAYING_VIDEOS (state, videos) {
      state.displayingVideos = videos
      ipcRenderer.send('dispatch-connect', 'updateDisplayingVideos', videos)
    }
  },
  actions: {
    updateVideos ({ commit }, videos) {
      commit('UPDATE_VIDEOS', videos)
    },
    updateDisplayingVideos ({ commit }, videos) {
      commit('UPDATE_DISPLAYING_VIDEOS', videos)
    }
  }
}
