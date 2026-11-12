// noinspection JSCheckFunctionSignatures

window.addEventListener('DOMContentLoaded', () => {

  const topNotification = document.getElementById('top-notification')
  const topNotificationCloseButton = document.getElementById('top-notification-close-button')
  const listOfFieldsets = document.getElementById('list-of-fieldsets')
  const fieldsetTemplate = document.getElementById('fieldset-template')
  const separatorTemplate = document.getElementById('separator-template')
  const addSearchButton = document.getElementById('add-search-button')
  const addSeparatorButton = document.getElementById('add-separator-button')
  const transformationsModalTemplate = document.getElementById('transformations-modal-template')
  const transformationsRowTemplate = document.getElementById('transformations-row-template')
  const loadDefaultsButton = document.getElementById('load-defaults-button')
  const sortAZButton = document.getElementById('sort-a-z-button')
  const importButton = document.getElementById('import-button')
  const exportButton = document.getElementById('export-button')
  const openInBackgroundCheckbox = document.getElementById('open-in-background-checkbox')
  const addUtmSourceCheckbox = document.getElementById('add-utm-source-checkbox')
  const saveButton = document.getElementById('save-button')
  const messageBox = document.getElementById('message-box')

  /*
   * =============================================================================
   * INITIALIZATION
   * =============================================================================
   */

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
        fieldset.querySelector('li').setAttribute('data-id', index)
        fieldset.querySelector('.search-name').value = fieldsets[index].name
        fieldset.querySelector('.search-url').value = fieldsets[index].url
        if (fieldsets[index].transformations) {
          fieldset.querySelector('li').setAttribute('data-transformations', JSON.stringify(fieldsets[index].transformations))
        }
      }
      listOfFieldsets.appendChild(fieldset)
    }
  }

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

  Sortable.create(listOfFieldsets, {
    // [name="searchName"], [name="searchUrl"] doesn't work
    filter: '.search-name, .search-url, .remove-fieldset-button',
    preventOnFilter: false,
  })

  topNotificationCloseButton.addEventListener('click', () => {
    chrome.storage.local.remove('updateMessage').then(() => {
      topNotification.style.display = 'none'
    })
  })

  listOfFieldsets.addEventListener('click', (e) => {
    if (e.target.classList.contains('transformations-button')) {

      const modalTemplate = transformationsModalTemplate.content.cloneNode(true)

      const parentLi = e.target.closest('li')
      const transformations = JSON.parse(parentLi.getAttribute('data-transformations'))

      // Search ID
      const searchId = parentLi.getAttribute('data-id')
      modalTemplate.getElementById('transformations-modal').setAttribute('data-id', searchId)

      // Search Name
      const searchNameBox = modalTemplate.querySelector('h4')
      searchNameBox.textContent = searchNameBox.textContent.replace(
        'name',
        parentLi.querySelector('.search-name').value
      )

      const toLowerCaseCheckbox = modalTemplate.querySelector('[name="toLowerCase"]')
      const toUpperCaseCheckbox = modalTemplate.querySelector('[name="toUpperCase"]')

      toLowerCaseCheckbox.addEventListener('click', caseCheckboxHandler)
      toUpperCaseCheckbox.addEventListener('click', caseCheckboxHandler)

      function caseCheckboxHandler(e) {
        if (e.target.getAttribute('name') === 'toLowerCase' && e.target.checked) {
          toUpperCaseCheckbox.checked = false
        } else {
          toLowerCaseCheckbox.checked = false
        }
      }

      let noRuleExists = true
      function addRule(el) {
        const rowTemplate = transformationsRowTemplate.content.cloneNode(true)
        rowTemplate.querySelector('.remove-transformations-row-button').addEventListener('click', (e) => {
          e.target.closest('.transformations-row').remove()
        })
        let currentModal
        if (!(el instanceof PointerEvent)) {
          currentModal = modalTemplate
          rowTemplate.querySelector('.regexp-field').value = el.search
          rowTemplate.querySelector('.flags-field').value = el.flags
          rowTemplate.querySelector('.replace-field').value = el.replace
        } else {
          currentModal = document
        }
        const lowerUpperCaseBox = currentModal.querySelector('#transformations-lower-upper-case-box')
        if (noRuleExists || !lowerUpperCaseBox.nextElementSibling.classList.contains('transformations-row')) {
          lowerUpperCaseBox.after(rowTemplate)
          noRuleExists = false
        } else {
          currentModal.querySelector(':nth-last-child(1 of .transformations-row)').after(rowTemplate)
        }
      }

      // Rows
      if (transformations) {
        toLowerCaseCheckbox.checked = transformations.toLowerCase
        toUpperCaseCheckbox.checked = transformations.toUpperCase
        transformations.searchAndReplace.forEach(addRule)
      }

      // Add Rule
      modalTemplate.getElementById('transformations-add-rule-button').addEventListener('click', addRule)

      // Save
      modalTemplate.getElementById('transformations-save-button').addEventListener('click', (e) => {
        const modal = e.target.closest('#transformations-modal')
        const toLowerCase = modal.querySelector('[name="toLowerCase"]').checked
        const toUpperCase = modal.querySelector('[name="toUpperCase"]').checked
        const messageBox = modal.querySelector('#transformations-message-box')
        const searchAndReplace = []
        let hasError = false
        Array.from(modal.querySelectorAll('.transformations-row')).every((row) => {
          const flags = row.querySelector('.flags-field')
          const search = row.querySelector('.regexp-field')
          const replace = row.querySelector('.replace-field')
          if (!search.value) {
            messageBox.textContent = 'The "RegExp" field must not be empty'
            search.focus()
            setTimeout(() => {
              messageBox.textContent = ''
            }, 1500)
            hasError = true
            return false
          } else if (!replace.value) {
            messageBox.textContent = 'The "Replace" field must not be empty'
            replace.focus()
            setTimeout(() => {
              messageBox.textContent = ''
            }, 1500)
            hasError = true
            return false
          } else {
            searchAndReplace.push({flags: flags.value, search: search.value, replace: replace.value})
            return true
          }
        })
        if (!hasError) {
          chrome.storage.sync.get(null, (storage) => {
            storage.fieldsets[searchId].transformations = {searchAndReplace, toLowerCase, toUpperCase}
            chrome.storage.sync.set(storage, () => {
              messageBox.textContent = 'Saved'
              setTimeout(() => {
                messageBox.textContent = ''
              }, 1500)
            })
            parentLi.setAttribute('data-transformations', JSON.stringify(storage.fieldsets[searchId].transformations))
          })
        }
      })

      // Close
      modalTemplate.getElementById('transformations-close-button').addEventListener('click', () => {
        document.getElementById('transformations-modal').remove()
      })

      // Append
      document.body.appendChild(modalTemplate)
    }
  })

  /*
   * =============================================================================
   * EVENTS
   * =============================================================================
   */

  // Add Search

  addSearchButton.addEventListener('click', () => {
    const template = fieldsetTemplate.content.cloneNode(true)
    template.querySelector('li').setAttribute('data-id', listOfFieldsets.querySelectorAll('[data-id]').length + 2)
    template.querySelector('.transformations-button').setAttribute('disabled', true)
    listOfFieldsets.appendChild(template)
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
      listOfFieldsets.setAttribute('data-load-defaults', true)
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
    chrome.storage.sync.get(null, (storage) => {

      const loadDefaults = listOfFieldsets.getAttribute('data-load-defaults')

      const newStorage = { fieldsets: [] }
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
          const searchId = fieldsets[i].getAttribute('data-id')
          let transformations
          if (loadDefaults) {
            transformations = {searchAndReplace: [], toLowerCase: false, toUpperCase: false}
          } else {
            transformations = {
              toLowerCase: storage.fieldsets[searchId]?.transformations?.toLowerCase || false,
              toUpperCase: storage.fieldsets[searchId]?.transformations?.toUpperCase || false,
              searchAndReplace: storage.fieldsets[searchId]?.transformations?.searchAndReplace || [],
            }
          }
          newStorage.fieldsets.push({name: nameInput.value, transformations, url: urlInput.value})
        } else {
          newStorage.fieldsets.push({name: '_separator_'})
        }
      }

      newStorage.openInBackground = openInBackgroundCheckbox.checked
      newStorage.addUtmSource = addUtmSourceCheckbox.checked
      chrome.storage.sync.set(newStorage, () => {
        messageBox.textContent = 'Saved'
        setTimeout(() => {
          messageBox.textContent = ''
        }, 1500)
        listOfFieldsets.querySelectorAll('.transformations-button').forEach((el) => {
          el.removeAttribute('disabled')
        })
        listOfFieldsets.removeAttribute('data-load-defaults')
      })
    })
  })

  // Link to "Load Defaults" button

  document.getElementById('link-to-load-defaults-button').addEventListener('click', (e) => {
    e.preventDefault()
    loadDefaultsButton.focus()
  })

})
