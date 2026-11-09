// noinspection JSCheckFunctionSignatures

window.addEventListener('DOMContentLoaded', () => {

  const topNotification = document.getElementById('top-notification')
  const topNotificationCloseButton = document.getElementById('top-notification-close-button')
  const listOfFieldsets = document.getElementById('list-of-fieldsets')
  const fieldsetTemplate = document.getElementById('fieldset-template')
  const separatorTemplate = document.getElementById('separator-template')
  const addSearchButton = document.getElementById('add-search-button')
  const addSeparatorButton = document.getElementById('add-separator-button')
  const sortAZButton = document.getElementById('sort-a-z-button')
  const importButton = document.getElementById('import-button')
  const exportButton = document.getElementById('export-button')
  const loadDefaultsButton = document.getElementById('load-defaults-button')
  const saveButton = document.getElementById('save-button')
  const messageBox = document.getElementById('message-box')
  const openInBackgroundCheckbox = document.getElementById('open-in-background-checkbox')
  const addUtmSourceCheckbox = document.getElementById('add-utm-source-checkbox')

  /*
   * =============================================================================
   * INITIALIZATION
   * =============================================================================
   */

  chrome.storage.sync.get(null, (storage) => {
    setFieldsets(storage.fieldsets)
    openInBackgroundCheckbox.checked = storage.openInBackground
    addUtmSourceCheckbox.checked = storage.addUtmSource
    chrome.storage.local.get(null, (localStorage) => {
      if (localStorage.updateMessage) {
        topNotification.append(document.createTextNode(localStorage.updateMessage))
        topNotification.style.display = 'block'
      }
    })
  })

  function setFieldsets(fieldsets) {
    if (!fieldsets) return
    // Remove old fieldsets
    listOfFieldsets.innerHTML = ''
    // Add new fieldsets
    for (let index in fieldsets) {
      let fieldset
      if (fieldsets[index].name === '_separator_') {
        fieldset = separatorTemplate.content.cloneNode(true)
      } else {
        fieldset = fieldsetTemplate.content.cloneNode(true)
        fieldset.querySelector('.search-name').value = fieldsets[index].name
        fieldset.querySelector('.search-url').value = fieldsets[index].url
      }
      listOfFieldsets.appendChild(fieldset)
    }
  }

  topNotificationCloseButton.addEventListener('click', () => {
    chrome.storage.local.remove('updateMessage').then(() => {
      topNotification.style.display = 'none'
    })
  })

  Sortable.create(listOfFieldsets, {
    // [name="searchName"], [name="searchUrl"] doesn't work
    filter: '.search-name, .search-url, .remove-fieldset-button',
    preventOnFilter: false,
  })

  /*
   * =============================================================================
   * EVENTS
   * =============================================================================
   */

  // Add Search

  addSearchButton.addEventListener('click', () => {
    listOfFieldsets.appendChild(fieldsetTemplate.content.cloneNode(true))
  })

  // Add Separator

  addSeparatorButton.addEventListener('click', () => {
    listOfFieldsets.appendChild(separatorTemplate.content.cloneNode(true))
  })

  // Sort (A-Z)

  sortAZButton.addEventListener('click', () => {
    const fieldsets = listOfFieldsets.querySelectorAll('li')
    const unorderedFieldsets = {}
    for (let i = 0; i < fieldsets.length; i++) {
      const name = fieldsets[i].querySelector('.search-name')
      if (name) {
        unorderedFieldsets[name.value] = fieldsets[i]
      }
    }
    const orderedFieldsets = {}
    Object.keys(unorderedFieldsets)
      .sort()
      .forEach((key) => {
        orderedFieldsets[key] = unorderedFieldsets[key]
      })
    listOfFieldsets.innerHTML = ''
    for (let name in orderedFieldsets) {
      listOfFieldsets.appendChild(orderedFieldsets[name])
    }
  })

  // Import

  importButton.addEventListener('click', () => {
    const fileChooser = document.createElement('input')
    fileChooser.type = 'file'
    fileChooser.addEventListener('change', () => {
      const file = fileChooser.files[0]
      const reader = new FileReader()
      reader.onload = () => {
        const storage = JSON.parse('' + reader.result)
        setFieldsets(storage.fieldsets)
        addUtmSourceCheckbox.checked = storage.addUtmSource
        openInBackgroundCheckbox.checked = storage.openInBackground
      }
      reader.readAsText(file)
      form.reset()
    })
    const form = document.createElement('form')
    form.appendChild(fileChooser)
    fileChooser.click()
  })

  // Export

  exportButton.addEventListener('click', () => {
    chrome.storage.sync.get(null, (storage) => {
      const jsonString = JSON.stringify(storage, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      chrome.downloads.download({
        url: url,
        filename: 'crx-context-menu-search.json',
        saveAs: false,
      }).then()
    })
  })

  // Load Defaults

  loadDefaultsButton.addEventListener('click', () => {
    chrome.storage.local.get(null, (storage) => {
      setFieldsets(storage.fieldsets)
      openInBackgroundCheckbox.checked = storage.openInBackground
      addUtmSourceCheckbox.checked = storage.addUtmSource
    })
  })

  // Remove

  listOfFieldsets.addEventListener('click', (eventObject) => {
    if (eventObject.target.classList.contains('remove-fieldset-button')) {
      eventObject.target.parentElement.remove()
    }
  })

  // Save

  saveButton.addEventListener('click', () => {
    const storage = { fieldsets: [] }
    const fieldsets = listOfFieldsets.querySelectorAll('li')
    for (let i = 0; i < fieldsets.length; i++) {
      const nameInput = fieldsets[i].querySelector('.search-name')
      if (nameInput) {
        if (!nameInput.value) {
          messageBox.textContent = 'The Search name must not be empty'
          nameInput.focus()
          setTimeout(() => {
            messageBox.textContent = ''
          }, 1500)
          return
        }
        const urlInput = fieldsets[i].querySelector('.search-url')
        if (urlInput) {
          if (!urlInput.value) {
            messageBox.textContent = 'The Search URL must not be empty'
            urlInput.focus()
            setTimeout(() => {
              messageBox.textContent = ''
            }, 1500)
            return
          }
        }
        storage.fieldsets.push({
          name: nameInput.value,
          url: urlInput.value,
        })
      } else {
        storage.fieldsets.push({name: '_separator_'})
      }
    }
    storage.openInBackground = openInBackgroundCheckbox.checked
    storage.addUtmSource = addUtmSourceCheckbox.checked
    chrome.storage.sync.set(storage, () => {
      messageBox.textContent = 'Saved'
      setTimeout(() => {
        messageBox.textContent = ''
      }, 1500)
    })
  })

  // Link to "Load Defaults" button

  document.getElementById('link-to-load-defaults-button').addEventListener('click', (e) => {
    e.preventDefault()
    loadDefaultsButton.focus()
  })

})
