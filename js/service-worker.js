
/* global app, chrome */

/**
 * @property chrome.contextMenus.onClicked
 * @property chrome.contextMenus.removeAll
 * @property chrome.storage.onChanged
 * @property chrome.runtime.onInstalled
 * @property chrome.storage.sync
 */

const app = {}

app.methods = {}

app.initialStorage = {
  fieldsets: [{
    name: 'Google - Exact match',
    url: 'https://www.google.com/search?q="%s"',
  }, {
    name: 'Google Images',
    url: 'https://www.google.com/search?q=%s&tbm=isch',
  }, {
    name: 'Facebook',
    url: 'https://www.facebook.com/search?q=%s',
  }, {
    name: 'YouTube',
    url: 'https://www.youtube.com/results?search_query=%s',
  }, {
    name: 'TikTok',
    url: 'https://www.tiktok.com/search?q=%s',
  }, {
    name: 'Wikipedia',
    url: 'https://wikipedia.org/w/index.php?search=%s',
  }, {
    name: '_separator_',
  }, {
    name: 'Google Maps',
    url: 'https://www.google.com/maps/search/%s',
  }, {
    name: 'Yandex Maps',
    url: 'https://yandex.com/maps?text=%s',
  }],
}

app.oldInitialStorage = {
  fieldsets: [{
    name: 'Google - Exact match',
    url: 'https://google.com/search?q="%s"',
  }, {
    name: 'Google Images',
    url: 'https://google.com/search?q=%s&tbm=isch',
  }, {
    name: 'YouTube',
    url: 'https://youtube.com/results?search_query=%s',
  }, {
    name: 'Facebook',
    url: 'https://facebook.com/search?q=%s',
  }, {
    name: 'Wikipedia',
    url: 'https://wikipedia.org/wiki/%s',
  }, {
    name: '_separator_',
  }, {
    name: 'Google Maps',
    url: 'https://google.com/maps/search/%s',
  }, {
    name: 'Yandex Maps',
    url: 'https://yandex.com/maps?text=%s',
  }],
}

chrome.runtime.onInstalled.addListener(_ => {
  // Calling chrome.storage.local.set(app.initialStorage) is required to access the initial fieldsets on the
  // Options page (see the Initialization section)
  chrome.storage.local.set(app.initialStorage)
  chrome.storage.sync.get(null, storage => {
    if (!storage.fieldsets) {
      chrome.storage.sync.set(app.initialStorage)
    } else {
      if (
        storage.fieldsets.every(
          (fieldset, index) =>
            app.oldInitialStorage.fieldsets[index]
            &&
            fieldset.name === app.oldInitialStorage.fieldsets[index].name
            &&
            fieldset.url === app.oldInitialStorage.fieldsets[index].url
        )
      ) {
        chrome.storage.sync.set(app.initialStorage)
      }
      chrome.storage.sync.get(null, storage => {
        // Bugfix
        storage.fieldsets.forEach(item => {
          if (item.url === 'https://www.tiktok.com/search?q=hello') {
            item.url = 'https://www.tiktok.com/search?q=%s'
          }
        })
        chrome.storage.sync.set(storage)
        // /Bugfix
        app.methods.setContextMenuItems(storage.fieldsets)
      })
    }
  })
})

app.methods.setContextMenuItems = fieldsets => {
  for (const index in fieldsets) {
    if (fieldsets[index].name === '_separator_') {
      chrome.contextMenus.create({
        id: index,
        contexts: ['selection', 'image'],
        type: 'separator',
      })
    } else {
      chrome.contextMenus.create({
        id: index,
        title: fieldsets[index].name,
        contexts: ['selection', 'image'],
      })
    }
  }
}

chrome.storage.onChanged.addListener(changes =>
  chrome.contextMenus.removeAll(
    _ => app.methods.setContextMenuItems(changes.fieldsets.newValue)
  )
)

/**
 * @param {String} info.menuItemId
 * @param {String} info.selectionText
 */
chrome.contextMenus.onClicked.addListener(
  info => chrome.storage.sync.get(null, storage => {
    let url = storage.fieldsets[info.menuItemId].url
    url = url.replace('%s', encodeURIComponent(info.srcUrl || info.selectionText))
    chrome.tabs.query({
      active: true,
      currentWindow: true,
    }, tabs => {
      let currentTab = tabs[0]
      chrome.tabs.create({
        url: url,
        index: currentTab.index + 1,
        openerTabId: currentTab.id,
      })
    })
  })
)
