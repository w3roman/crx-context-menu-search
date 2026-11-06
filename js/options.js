window.addEventListener('DOMContentLoaded', () => {

  const listOfFieldsets = document.getElementById('list-of-fieldsets')
  const fieldsetTemplate = document.getElementById('fieldset-template')
  const separatorTemplate = document.getElementById('separator-template')
  const addSearchButton = document.getElementById('add-search-button')
  const addSeparatorButton = document.getElementById('add-separator-button')
  const sortAZButton = document.getElementById('sort-a-z-button')
  const saveButton = document.getElementById('save-button')
  const errorBag = document.getElementById('error-bag')
  const utmSourceCheckbox = document.getElementById('utm-source-checkbox')

  /*
   * =============================================================================
   * INITIALIZATION
   * =============================================================================
   */

  chrome.storage.sync.get(null, (storage) => {
    setFieldsets(storage.fieldsets)
    utmSourceCheckbox.checked = storage.utmSource
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

  document.getElementById('import-button')
    .addEventListener('click', () => {
      const fileChooser = document.createElement('input')
      fileChooser.type = 'file'
      fileChooser.addEventListener('change', () => {
        const file = fileChooser.files[0]
        const reader = new FileReader()
        reader.onload = () => {
          const storage = JSON.parse('' + reader.result)
          setFieldsets(storage.fieldsets)
        }
        reader.readAsText(file)
        form.reset()
      })
      const form = document.createElement('form')
      form.appendChild(fileChooser)
      fileChooser.click()
    })

  // Export

  document.getElementById('export-button')
    .addEventListener('click', () => {
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

  document.getElementById('load-defaults-button')
    .addEventListener('click', () => {
      chrome.storage.local.get(null, (storage) => {
        setFieldsets(storage.fieldsets)
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
          errorBag.textContent = 'The Search name must not be empty'
          nameInput.focus()
          setTimeout(() => {
            errorBag.textContent = ''
          }, 1500)
          return
        }
        const urlInput = fieldsets[i].querySelector('.search-url')
        if (urlInput) {
          if (!urlInput.value) {
            errorBag.textContent = 'The Search URL must not be empty'
            urlInput.focus()
            setTimeout(() => {
              errorBag.textContent = ''
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
    storage.utmSource = utmSourceCheckbox.checked
    chrome.storage.sync.set(storage, () => {
      saveButton.textContent = 'Saved'
      saveButton.style.color = '#f00'
      setTimeout(() => {
        saveButton.textContent = 'Save'
        saveButton.style.color = 'initial'
      }, 1000)
    })
  })

  // Link to "Load Defaults" button

  document.getElementById('link-to-load-defaults-button').addEventListener('click', (e) => {
    e.preventDefault()
    document.getElementById('load-defaults-button').focus()
  })

})
