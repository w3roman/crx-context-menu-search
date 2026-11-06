// noinspection JSCheckFunctionSignatures

const app = {}

app.initialStorage = {
  fieldsets: [{
    name: 'Google Exact Match',
    url: 'https://www.google.com/search?q="%s"',
  }, {
    name: 'Google Images',
    url: 'https://www.google.com/search?q=%s&udm=2',
  }, {
    name: 'Google Maps',
    url: 'https://www.google.com/maps/search/%s',
  }, {
    name: '_separator_',
  }, {
    name: 'Wikipedia',
    url: 'https://wikipedia.org/w/index.php?search=%s',
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
    name: '_separator_',
  }, {
    name: 'Yandex',
    url: 'https://ya.ru/search/?clid=15525262&text=%s',
  }, {
    name: 'Yandex Maps',
    url: 'https://yandex.com/maps?clid=15525262&text=%s',
  }],
}

chrome.runtime.onInstalled.addListener(() => {
  // Calling chrome.storage.local.set(app.initialStorage) is required to access the initial fieldsets on the
  // Options page (see the INITIALIZATION section)
  chrome.storage.local.set(app.initialStorage).then(
    () => chrome.storage.sync.get(null, (storage) => {
      if (storage.fieldsets) {
        chrome.storage.sync.set(storage).then()
      } else {
        chrome.storage.sync.set(app.initialStorage).then()
      }
      // This call is necessary for rendering Search items in the context menu, since if the set of fields has not changed
      // (see above), the `change` event, whose handler calls the setContextMenuItems() method, will not fire
      app.methods.setContextMenuItems(storage.fieldsets)
    })
  )
})

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') return
  chrome.contextMenus.removeAll(() => {
    app.methods.setContextMenuItems(changes.fieldsets.newValue)
  })
})

app.methods = {}

app.methods.setContextMenuItems = (fieldsets) => {
  const contexts = ['selection', 'image']
  for (const index in fieldsets) {
    if (fieldsets[index].name === '_separator_') {
      chrome.contextMenus.create({
        id: index,
        contexts,
        type: 'separator',
      })
    } else {
      chrome.contextMenus.create({
        id: index,
        contexts,
        title: fieldsets[index].name,
      })
    }
  }
}

chrome.contextMenus.onClicked.addListener((info) => {
  chrome.storage.sync.get(null, (storage) => {
    let url = storage.fieldsets[info.menuItemId].url
    url = url.replace('%s', encodeURIComponent(info.srcUrl || info.selectionText))
    chrome.tabs.query(
      {active: true, currentWindow: true},
      (tabs) => {
        let currentTab = tabs[0]
        chrome.tabs.create({
          url: url,
          index: currentTab.index + 1,
          openerTabId: currentTab.id,
        }).then()
      }
    )
  })
})

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage().then()
})
