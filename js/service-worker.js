// noinspection JSCheckFunctionSignatures

const app = {}

/*

[{
  name: 'Google Exact Match',
  url: 'https://www.google.com/search?q="%s"',
}, {
  name: 'Google AI Mode',
  url: 'https://www.google.com/search?q=%s&udm=50',
}, {
  name: 'Google Images',
  url: 'https://www.google.com/search?q=%s&udm=2',
}, {
  name: 'Google Maps',
  url: 'https://www.google.com/maps?q=%s',
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
  url: 'https://ya.ru/maps/?clid=15525262&text=%s',
}]

*/

app.initialStorage = {
  addUtmSource: true,
  fieldsets: [{
    name: 'Google Exact Match',
    transformations: {rules: [], toLowerCase: false, toUpperCase: false},
    url: 'https://www.google.com/search?q="%s"',
  }, {
    name: 'Google AI Mode',
    transformations: {rules: [], toLowerCase: false, toUpperCase: false},
    url: 'https://www.google.com/search?q=%s&udm=50',
  }, {
    name: 'Google Images',
    transformations: {rules: [], toLowerCase: false, toUpperCase: false},
    url: 'https://www.google.com/search?q=%s&udm=2',
  }, {
    name: 'Google Maps',
    transformations: {rules: [], toLowerCase: false, toUpperCase: false},
    url: 'https://www.google.com/maps?q=%s',
  }, {
    name: '_separator_',
  }, {
    name: 'Wikipedia',
    transformations: {rules: [], toLowerCase: false, toUpperCase: false},
    url: 'https://wikipedia.org/w/index.php?search=%s',
  }, {
    name: 'Facebook',
    transformations: {rules: [], toLowerCase: false, toUpperCase: false},
    url: 'https://www.facebook.com/search?q=%s',
  }, {
    name: 'YouTube',
    transformations: {rules: [], toLowerCase: false, toUpperCase: false},
    url: 'https://www.youtube.com/results?search_query=%s',
  }, {
    name: 'TikTok',
    transformations: {rules: [], toLowerCase: false, toUpperCase: false},
    url: 'https://www.tiktok.com/search?q=%s',
  }, {
    name: '_separator_',
  }, {
    name: 'Yandex',
    transformations: {rules: [], toLowerCase: false, toUpperCase: false},
    url: 'https://ya.ru/search/?clid=15525262&text=%s',
  }, {
    name: 'Yandex Maps',
    transformations: {rules: [], toLowerCase: false, toUpperCase: false},
    url: 'https://ya.ru/maps/?clid=15525262&text=%s',
  }],
  openInBackground: false
}

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

chrome.runtime.onInstalled.addListener((details) => {
  // Calling chrome.storage.local.set(app.initialStorage) is required to access the initial fieldsets on the
  // Options page (see the INITIALIZATION section)
  chrome.storage.local.set(app.initialStorage).then(
    () => chrome.storage.sync.get(null, (storage) => {
      chrome.storage.sync.set(storage.fieldsets ? storage : app.initialStorage).then(() => {})
      // This call is necessary for rendering Search items in the context menu, since if the set of fields has not
      // changed (see below), the `change` event, whose handler calls the setContextMenuItems() method, will not fire
      app.methods.setContextMenuItems(storage.fieldsets || app.initialStorage.fieldsets)
      if (details.reason === 'install') {
        chrome.runtime.openOptionsPage().then()
      }
      // else if (details.reason === 'update') {
      //   chrome.storage.local.set({updateMessage: 'The extension has been updated'}).then(
      //     () => chrome.runtime.openOptionsPage().then()
      //   )
      // }
    })
  )
})

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') return
  if (changes.fieldsets) {
    chrome.contextMenus.removeAll(() => {
      app.methods.setContextMenuItems(changes.fieldsets.newValue)
    })
  }
})

chrome.contextMenus.onClicked.addListener((info) => {
  chrome.storage.sync.get(null, (storage) => {
    const fieldset = storage.fieldsets[info.menuItemId]
    let url = fieldset.url
    // https://pdfobject.com/pdf/sample.pdf
    let text = info.srcUrl && info.srcUrl.search(/^chrome-extension:\/\//) !== 0
        ? info.srcUrl
        : info.selectionText
    if (fieldset.transformations?.toLowerCase) {
      text = text.toLowerCase()
    } else if (fieldset.transformations?.toUpperCase) {
      text = text.toUpperCase()
    }
    if (fieldset.transformations?.rules) {
      fieldset.transformations.rules.forEach((el) => {
        const regexp = new RegExp(el.regexp, el.flags)
        text = text.replace(regexp, el.replace)
      })
    }
    url = url.replace('%s', encodeURIComponent(text))
    if (storage.addUtmSource) {
      url += url.includes('?') ? '&' : '?'
      url += 'utm_source=chromewebstore.google.com/detail/idpcgabojogahgmhdgnjkmdliaeeofka'
    }
    chrome.tabs.query(
      {active: true, currentWindow: true},
      (tabs) => {
        let currentTab = tabs[0]
        chrome.tabs.create({
          active: !storage.openInBackground,
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
