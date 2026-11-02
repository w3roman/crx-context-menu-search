
/* global Sortable */

window.addEventListener('DOMContentLoaded', () => {

  const listOfFieldsets = document.getElementById('list-of-fieldsets')
  const fieldsetTemplate = document.getElementById('fieldset-template')
  const separatorTemplate = document.getElementById('separator-template')
  const addButton = document.getElementById('add-button')
  const addSeparatorButton = document.getElementById('add-separator-button')
  const sortAZButton = document.getElementById('sort-a-z-button')
  const saveButton = document.getElementById('save-button')

  /*
   * =============================================================================
   * INITIALIZATION
   * =============================================================================
   */

  chrome.storage.sync.get(null, storage => {
    setFieldsets(storage.fieldsets)
    // If only Search remains, we hide the controls
    if (document.querySelectorAll('.remove-fieldset-button').length === 1) {
      document.querySelector('.remove-fieldset-button').classList.add('hidden')
      document.querySelector('.up-down-arrow').classList.add('invisible')
    }
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
        fieldset.querySelector('.name').value = fieldsets[index].name
        fieldset.querySelector('.url').value = fieldsets[index].url
      }
      listOfFieldsets.appendChild(fieldset)
    }
  }

  Sortable.create(listOfFieldsets, {
    filter: '.name, .url, .remove-fieldset-button',
    preventOnFilter: false,
  })

  /*
   * =============================================================================
   * EVENTS
   * =============================================================================
   */

  // Add Search

  addButton.addEventListener('click', () => {
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
      let name = fieldsets[i].querySelector('.name')
      if (name) {
        unorderedFieldsets[name.value] = fieldsets[i]
      }
    }
    const orderedFieldsets = {}
    Object.keys(unorderedFieldsets).sort().forEach(key => orderedFieldsets[key] = unorderedFieldsets[key])
    listOfFieldsets.innerHTML = ''
    for (let name in orderedFieldsets) {
      listOfFieldsets.appendChild(orderedFieldsets[name])
    }
  })

  // Import

  // https://stackoverflow.com/a/36930012/4223982
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

  // https://stackoverflow.com/a/23167789/4223982
  document.getElementById('export-button')
    .addEventListener('click', () => {
      chrome.storage.sync.get(null, storage => {
        const result = JSON.stringify(storage)
        // `unescape(encodeURIComponent())` is needed to avoid the following error:
        // Failed to execute 'btoa' on 'Window':
        // The string to be encoded contains characters outside of the Latin1 range.
        const url = 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(result)))
        chrome.downloads.download({
          url: url,
          filename: 'context-menu-search.json',
        })
      })
    })

  // Load Defaults

  document.getElementById('load-defaults-button')
    .addEventListener('click', () => chrome.storage.local.get(null, storage => setFieldsets(storage.fieldsets)))

  // Remove

  listOfFieldsets.addEventListener('click', eventObject => {
    if (eventObject.target.classList.contains('remove-fieldset-button')) {
      eventObject.target.parentElement.remove()
    }
  })

  // Save

  saveButton.addEventListener('click', () => {
    const data = { fieldsets: [] }
    const fieldsets = listOfFieldsets.querySelectorAll('li')
    for (let i = 0; i < fieldsets.length; i++) {
      const nameInput = fieldsets[i].querySelector('.name')
      if (nameInput) {
        data.fieldsets.push({
          name: nameInput.value,
          url: fieldsets[i].querySelector('.url').value,
        })
      } else {
        data.fieldsets.push({name: '_separator_'})
      }
    }
    chrome.storage.sync.set(data, () => {
      saveButton.textContent = 'Saved'
      saveButton.style.color = '#f00'
      setTimeout(() => {
        saveButton.textContent = 'Save'
        saveButton.style.color = 'inherit'
      }, 1000)
    })
  })

})
