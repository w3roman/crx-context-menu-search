// noinspection JSIgnoredPromiseFromCall,JSCheckFunctionSignatures

const app = {}

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

chrome.runtime.onInstalled.addListener(() => {
  // Calling chrome.storage.local.set(app.initialStorage) is required to access the initial fieldsets on the
  // Options page (see the INITIALIZATION section)
  chrome.storage.local.set(app.initialStorage)

  chrome.storage.sync.get(null, (storage) => {
    if (storage.fieldsets) {
      chrome.storage.sync.set(storage)
    } else {
      chrome.storage.sync.set(app.initialStorage)
    }
    app.methods.setContextMenuItems(storage.fieldsets)
  })
})

chrome.storage.onChanged.addListener((changes) => {
  chrome.contextMenus.removeAll(() => {
    app.methods.setContextMenuItems(changes.fieldsets.newValue)
  })
})

app.methods = {}

app.methods.setContextMenuItems = (fieldsets) => {
  chrome.contextMenus.create({
    id: 'yandex-distribution',
    contexts: ['selection', 'image'],
    title: 'Yandex',
  })
  chrome.contextMenus.create({
    id: 'yandex-distribution-separator',
    contexts: ['selection', 'image'],
    type: 'separator',
  })
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
        contexts: ['selection', 'image'],
        title: fieldsets[index].name,
      })
    }
  }
}

chrome.contextMenus.onClicked.addListener((info) => {
  chrome.storage.sync.get(null, (storage) => {
    let url = info.menuItemId === 'yandex-distribution'
      ? 'https://ya.ru/search/?clid=15524895&text=%s'
      : storage.fieldsets[info.menuItemId].url
    url = url.replace('%s', encodeURIComponent(info.srcUrl || info.selectionText))
    chrome.tabs.query(
      {active: true, currentWindow: true},
      (tabs) => {
        let currentTab = tabs[0]
        chrome.tabs.create({
          url: url,
          index: currentTab.index + 1,
          openerTabId: currentTab.id,
        })
      }
    )
  })
})
