'use strict'

import {
  app,
  BrowserWindow
} from 'electron'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

let visualWindow
const winVisualURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/visual.html`
  : `file://${__dirname}/visual.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
    visualWindow = null
  })

  createVisualWindow(mainWindow)
}

function createVisualWindow (mainWindow) {
  visualWindow = new BrowserWindow({
    parent: mainWindow,
    width: 1024,
    height: 768
  })

  visualWindow.loadURL(winVisualURL)

  visualWindow.on('closed', () => {
    visualWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})