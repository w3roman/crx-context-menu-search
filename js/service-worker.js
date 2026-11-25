// noinspection JSCheckFunctionSignatures

importScripts('config.js')

function setContextMenuItems(fieldsets) {
  const contexts = ['image', 'selection']
  fieldsets.forEach((fieldset, index) => {
    if (fieldset.enabled === false) {
      return
    }
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
    defaultFieldsets,
    () => chrome.storage.sync.get(null, (storage) => {
      if (storage.fieldsets) {
        setContextMenuItems(storage.fieldsets)
      } else { // details.reason === 'install'
        // `setContextMenuItems()` will be called in the `chrome.storage.onChanged` handler
        chrome.storage.sync.set(defaultFieldsets, () => {
          chrome.runtime.openOptionsPage(() => {})
        })
      }
      // if (details.reason === 'update') {
      //   chrome.storage.local.set(
      //     { updateMessage: 'The extension has been updated!' },
      //     () => {
      //       chrome.runtime.openOptionsPage(() => {})
      //     }
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

/**
 * General properties of the `info` object:
 * {
 *   editable: false,
 *   frameId: 0,
 *   frameUrl: "<url>",
 *   menuItemId: "<id>",
 *   pageUrl: "<url>",
 * }
 * When text is selected, `selectionText: "<text>"` is added
 * When an image is clicked, `mediaType: "image"` and `srcUrl: "<url>"` are added
 * When link text is selected or an image-link is clicked, the `linkUrl: "<url>"` property is added
 */
chrome.contextMenus.onClicked.addListener((info) => {
  chrome.storage.sync.get(null, (storage) => {
    const fieldset = storage.fieldsets[info.menuItemId]
    let url = fieldset.url
    // https://ya.ru/images/search?rpt=imageview&url=https://grinvik.com/img/grinvik-brand.png
    // https://grinvik.com/samples/sample.pdf
    // `mhjfbmdgcfjbbpaeojofohoefgiehjai` is the built-in extension ID for Google Chrome's internal PDF Viewer
    let text = info.srcUrl && info.srcUrl.search(/^chrome-extension:\/\/mhjfbmdgcfjbbpaeojofohoefgiehjai/) !== 0
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
