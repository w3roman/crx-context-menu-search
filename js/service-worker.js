// noinspection JSCheckFunctionSignatures

importScripts('config.js')

function setContextMenuItems(fieldsets) {
  const contexts = ['image', 'selection']
  fieldsets.forEach((fieldset, index) => {
    const options = { id: '' + index,  contexts }
    if (fieldset.name === '_separator_') {
      options.type = 'separator'
    } else {
      options.title = fieldset.name
    }
    chrome.contextMenus.create(options)
  })
}

// noinspection JSUnusedLocalSymbols
chrome.runtime.onInstalled.addListener((details) => {
  // `chrome.storage.local.set(defaultOptions)` is required for the Options page
  chrome.storage.local.set(
    defaultOptions,
    () => chrome.storage.sync.get(null, (storage) => {
      if (storage.fieldsets) {
        setContextMenuItems(storage.fieldsets)
      } else { // details.reason === 'install'
        chrome.storage.sync.set(defaultOptions, () => {
          chrome.runtime.openOptionsPage(() => {})
        })
      }
      // if (details.reason === 'update') {
      //   chrome.storage.local.set(
      //     { updateMessage: 'The extension has been updated' },
      //     () => chrome.runtime.openOptionsPage()
      //   )
      // }
    })
  )
})

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') return
  if (changes.fieldsets) {
    chrome.contextMenus.removeAll(() => {
      setContextMenuItems(changes.fieldsets.newValue)
    })
  }
})

chrome.contextMenus.onClicked.addListener((info) => {
  chrome.storage.sync.get(null, (storage) => {
    const fieldset = storage.fieldsets[info.menuItemId]
    let url = fieldset.url
    // https://yandex.by/images/search?rpt=imageview&url=https://grinvik.com/img/grinvik-brand.png
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
      fieldset.transformations.rules.forEach((e) => {
        const regexp = new RegExp(e.regexp, e.flags)
        text = text.replace(regexp, e.replace)
      })
    }
    url = url.replace('%s', encodeURIComponent(text))
    if (storage.addUtmSource) {
      url += url.includes('?') ? '&' : '?'
      url += 'utm_source=chromewebstore.google.com/detail/idpcgabojogahgmhdgnjkmdliaeeofka'
    }
    chrome.tabs.query(
      { active: true, currentWindow: true },
      (tabs) => {
        let currentTab = tabs[0]
        chrome.tabs.create({
          active: !storage.openInBackground,
          url: url,
          index: currentTab.index + 1,
          openerTabId: currentTab.id,
        }, () => {})
      }
    )
  })
})

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage(() => {})
})
