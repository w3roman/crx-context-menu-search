// noinspection JSCheckFunctionSignatures

window.addEventListener('DOMContentLoaded', () => {

  const MSG_TIMEOUT = 1500

  const topNotification = document.getElementById('top-notification')
  const topNotificationCloseButton = document.getElementById('top-notification-close-button')
  const listOfFieldsets = document.getElementById('list-of-fieldsets')
  const fieldsetTemplate = document.getElementById('fieldset-template')
  const separatorTemplate = document.getElementById('separator-template')
  const addSearchButton = document.getElementById('add-search-button')
  const addSeparatorButton = document.getElementById('add-separator-button')
  const transformationsModalTemplate = document.getElementById('transformations-modal-template')
  const transformationRuleTemplate = document.getElementById('transformation-rule-template')
  const loadDefaultsButton = document.getElementById('load-defaults-button')
  const sortAZButton = document.getElementById('sort-a-z-button')
  const importButton = document.getElementById('import-button')
  const exportButton = document.getElementById('export-button')
  const openInBackgroundCheckbox = document.getElementById('open-in-background-checkbox')
  const addUtmSourceCheckbox = document.getElementById('add-utm-source-checkbox')
  const controlsSaveButton = document.getElementById('controls-save-button')
  const discardChangesButton = document.getElementById('discard-changes-button')
  const controlsMessageBox = document.getElementById('controls-message-box')

  /*
   * =============================================================================
   * INITIALIZATION
   * =============================================================================
   */

  function setFieldsets(fieldsets) {
    listOfFieldsets.innerHTML = ''
    fieldsets.forEach((fieldset, index) => {
      let newFieldset
      if (fieldset.name === '_separator_') {
        newFieldset = separatorTemplate.content.cloneNode(true)
      } else {
        newFieldset = fieldsetTemplate.content.cloneNode(true)
        const li = newFieldset.querySelector('li')
        const searchNameInput = li.querySelector('[name="searchName"]')
        const searchUrlInput = li.querySelector('[name="searchUrl"]')
        searchNameInput.value = fieldset.name
        searchUrlInput.value = fieldset.url
        if (fieldset.enabled === undefined || fieldset.enabled === true) {
          li.querySelector('[type="checkbox"]').checked = true
        } else { // Disabled
          searchNameInput.setAttribute('disabled', true)
          searchUrlInput.setAttribute('disabled', true)
          li.querySelector('.transformations-button').setAttribute('disabled', true)
        }
        // `data-id` is used when saving Transformations
        li.setAttribute('data-id', index)
        // We attach the transformations to `<li>` because deleting a fieldset causes the indexes to shift
        li.setAttribute(
          'data-transformations',
          JSON.stringify(fieldset.transformations || defaultTransformations)
        )
      }
      listOfFieldsets.appendChild(newFieldset)
    })
  }

  function setShowDiscardButtonHandler() {
    listOfFieldsets.querySelectorAll('li').forEach((li) => {
      const enabledCheckbox = li.querySelector('[type="checkbox"]')
      if (enabledCheckbox) { // Skip separators
        enabledCheckbox.addEventListener('change', showDiscardButton)
        li.querySelector('[name="searchName"]').addEventListener('input', showDiscardButton)
        li.querySelector('[name="searchUrl"]').addEventListener('input', showDiscardButton)
      }
    })
  }

  function disableTransformations(addingSearch) {
    listOfFieldsets.querySelectorAll(addingSearch ? 'li:last-child' : 'li').forEach((li) => {
      const transformationsButton = li.querySelector('.transformations-button')
      if (transformationsButton) { // Not `_separator_`
        transformationsButton.setAttribute('disabled', true)
        transformationsButton.setAttribute('data-title', 'Save Settings')
      }
    })
  }

  function showMessage(element, message, cssClass) {
    element.classList.add(cssClass)
    element.textContent = message
    setTimeout(() => {
      element.textContent = ''
      element.classList.remove(cssClass)
    }, MSG_TIMEOUT)
  }

  chrome.storage.sync.get(null, (storage) => {

    // Options

    setFieldsets(storage.fieldsets)
    openInBackgroundCheckbox.checked = !!storage.openInBackground
    addUtmSourceCheckbox.checked = !!storage.addUtmSource

    // Sortable

    Sortable.create(listOfFieldsets, { handle: '.up-down-arrow' })

    // Fieldsets Changes

    const observer = new MutationObserver(async (mutations) => {
      let needCheckChanges = false
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeName === 'LI') needCheckChanges = true
        }
        for (const node of mutation.removedNodes) {
          if (node.nodeName === 'LI') needCheckChanges = true
        }
      }
      if (needCheckChanges) await showDiscardButton()
    })

    observer.observe(listOfFieldsets, { childList: true })

    setShowDiscardButtonHandler()
  })

  // Top notification

  chrome.storage.local.get(null, (localStorage) => {
    if (localStorage.updateMessage) {
      let div = document.createElement('div')
      div.innerHTML = '' + localStorage.updateMessage
      topNotification.append(div)
      topNotification.style.display = 'block'
      topNotificationCloseButton.addEventListener('click', () => {
        chrome.storage.local.remove('updateMessage', () => {
          topNotification.style.display = 'none'
        })
      })
    }
  })

  /*
   * =============================================================================
   * EVENTS
   * =============================================================================
   */

  // Enable / Disable search checkbox

  listOfFieldsets.addEventListener('change', (e) => {
    if (e.target.classList.contains('fieldset-enabled')) {
      const parentLi = e.target.closest('li')
      if (e.target.checked) {
        parentLi.querySelector('[name="searchName"]').removeAttribute('disabled')
        parentLi.querySelector('[name="searchUrl"]').removeAttribute('disabled')
        parentLi.querySelector('.transformations-button').removeAttribute('disabled')
      } else {
        parentLi.querySelector('[name="searchName"]').setAttribute('disabled', true)
        parentLi.querySelector('[name="searchUrl"]').setAttribute('disabled', true)
        parentLi.querySelector('.transformations-button').setAttribute('disabled', true)
      }
    }
  })

  // "Add Search" button

  addSearchButton.addEventListener('click', () => {
    const template = fieldsetTemplate.content.cloneNode(true)
    const ids = []
    listOfFieldsets.querySelectorAll('[data-id]').forEach((li) => {
      ids.push(+li.getAttribute('data-id'))
    })
    const lastFieldsetId = Math.max(...ids)
    // `data-id` is used when saving Transformations
    template.querySelector('li').setAttribute('data-id', lastFieldsetId + 1)
    template.querySelector('[type="checkbox"]').checked = true
    listOfFieldsets.appendChild(template)
    disableTransformations(true)
    listOfFieldsets.querySelector('li:last-child [name="searchName"]').focus()
  })

  // "Add Separator" button

  addSeparatorButton.addEventListener('click', () => {
    listOfFieldsets.appendChild(separatorTemplate.content.cloneNode(true))
  })

  // "Load Defaults" button

  loadDefaultsButton.addEventListener('click', () => {
    chrome.storage.local.get(null, (storage) => {
      setFieldsets(storage.fieldsets)
      openInBackgroundCheckbox.checked = false
      addUtmSourceCheckbox.checked = true
      // To save the Defaults, the user must click the Save button in the Controls block. However, they may open
      // Transformations, change something there, click the Save button in the Transformations modal, and then close or
      // reload the Options page without clicking the Save button in the Controls block. In this case, the loaded
      // Transformations may get attached to a different Search that has, if it has one at all, the same ordinal index
      // as the loaded Search.
      disableTransformations()
      listOfFieldsets.setAttribute('data-show-discard-changes-button', true)
    })
  })

  // Sort (A-Z) fieldsets button

  sortAZButton.addEventListener('click', () => {
    const fieldsets = listOfFieldsets.querySelectorAll('li')
    const unorderedFieldsets = {}
    fieldsets.forEach((fieldset) => {
      const nameInput = fieldset.querySelector('[name="searchName"]')
      if (nameInput) { // Else it is the separator
        unorderedFieldsets[nameInput.value] = fieldset
      }
    })
    const orderedFieldsets = {}
    Object.keys(unorderedFieldsets).sort().forEach((searchName) => {
      orderedFieldsets[searchName] = unorderedFieldsets[searchName]
    })
    listOfFieldsets.innerHTML = ''
    for (let searchName in orderedFieldsets) {
      listOfFieldsets.appendChild(orderedFieldsets[searchName])
    }
  })

  // Import settings button

  importButton.addEventListener('click', () => {
    const fileChooser = document.createElement('input')
    fileChooser.type = 'file'
    fileChooser.addEventListener('change', () => {
      const file = fileChooser.files[0]
      const reader = new FileReader()
      reader.onload = () => {
        const storage = JSON.parse(reader.result)
        setFieldsets(storage.fieldsets)
        openInBackgroundCheckbox.checked = storage.openInBackground
        addUtmSourceCheckbox.checked = storage.addUtmSource
        // To save the import, the user must click the Save button in the Controls block. However, they may open
        // Transformations, change something there, click the Save button in the Transformations modal, and then close
        // or reload the Options page without clicking the Save button in the Controls block. In this case, the imported
        // Transformations may get attached to a different Search that has, if it has one at all, the same ordinal index
        // as the imported Search.
        disableTransformations()
        listOfFieldsets.setAttribute('data-show-discard-changes-button', true)
      }
      reader.readAsText(file)
      form.reset()
    })
    const form = document.createElement('form')
    form.appendChild(fileChooser)
    fileChooser.click()
  })

  // Export settings button

  exportButton.addEventListener('click', () => {
    chrome.storage.sync.get(null, (storage) => {
      const jsonString = JSON.stringify(storage, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      chrome.downloads.download({
        url: url,
        filename: 'crx-context-menu-search.json',
        saveAs: true,
      }, () => {})
    })
  })

  // Remove fieldset button

  listOfFieldsets.addEventListener('click', (e) => {
    if (e.target.classList.contains('fieldset-remove-button')) {
      e.target.parentElement.remove()
    }
  })

  // Save settings button

  controlsSaveButton.addEventListener('click', () => {
    const newStorage = { fieldsets: [] }
    const fieldsets = listOfFieldsets.querySelectorAll('li')
    let thereIsAnError = false
    Array.from(fieldsets).every((fieldset) => {
      const nameInput = fieldset.querySelector('[name="searchName"]')
      if (nameInput) {
        if (!nameInput.value) {
          thereIsAnError = true
          nameInput.focus()
          showMessage(controlsMessageBox, 'The Search name must not be empty', 'color-error')
          return false
        }
        const urlInput = fieldset.querySelector('[name="searchUrl"]')
        if (!urlInput.value) {
          thereIsAnError = true
          urlInput.focus()
          showMessage(controlsMessageBox, 'The Search URL must not be empty', 'color-error')
          return false
        }
        newStorage.fieldsets.push({
          enabled: fieldset.querySelector('[type="checkbox"]').checked,
          name: nameInput.value,
          // For Import and Defaults, since `.transformations` may not be present there, and when `setFieldsets()` is
          // called, `defaultTransformations` will be set. And during a regular save, Transformations are already
          // written to `chrome.storage.sync`.
          transformations: JSON.parse(fieldset.getAttribute('data-transformations')),
          url: urlInput.value,
        })
      } else {
        newStorage.fieldsets.push({ name: '_separator_' })
      }
      return true
    })
    if (!thereIsAnError) {
      newStorage.openInBackground = openInBackgroundCheckbox.checked
      newStorage.addUtmSource = addUtmSourceCheckbox.checked
      chrome.storage.sync.set(newStorage, () => {
        listOfFieldsets.querySelectorAll('li').forEach((li) => {
          const enabledCheckbox = li.querySelector('[type="checkbox"]')
          if (enabledCheckbox) {
            enabledCheckbox.removeAttribute('disabled')
            enabledCheckbox.removeAttribute('data-title')
            if (enabledCheckbox.checked) {
              const transformationsButton = li.querySelector('.transformations-button')
              transformationsButton.removeAttribute('disabled')
              transformationsButton.removeAttribute('data-title')
            }
          }
        })
        listOfFieldsets.removeAttribute('data-show-discard-changes-button')
        listOfFieldsets.querySelectorAll('[data-title]').forEach((checkboxOrButton) => {
          checkboxOrButton.removeAttribute('data-title')
        })
        discardChangesButton.style.display = 'none'
        setShowDiscardButtonHandler()
        showMessage(controlsMessageBox, 'Saved', 'color-success')
      })
    }
  })

  // Transformations

  listOfFieldsets.addEventListener('click', (e) => {
    if (e.target.classList.contains('transformations-button')) {

      //  Transformations modal template

      const modalTemplate = transformationsModalTemplate.content.cloneNode(true)

      // Parent <li>

      const parentLi = e.target.closest('li')

      // Transformations search name

      modalTemplate.querySelector('#transformations-search-name-box').textContent =
        parentLi.querySelector('[name="searchName"]').value

      // Transformations casing

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

      // Transformations rules

      const transformations = JSON.parse(parentLi.getAttribute('data-transformations'))
      toLowerCaseCheckbox.checked = transformations.toLowerCase
      toUpperCaseCheckbox.checked = transformations.toUpperCase
      transformations.rules.forEach(addRule)

      modalTemplate.getElementById('transformations-add-rule-button')
        .addEventListener('click', addRule)

      function addRule(e) {
        const ruleTemplate = transformationRuleTemplate.content.cloneNode(true)
        // It should be placed before `.after(ruleTemplate)`
        ruleTemplate.querySelector('.transformation-rule-remove-button')
          .addEventListener('click', (e) => {
            e.target.closest('.transformation-rule').remove()
          })
        let currentDocument
        if (e instanceof PointerEvent) { // Click on the `Add Rule` button
          currentDocument = document
        } else { // Opening the Transformations modal
          currentDocument = modalTemplate
          ruleTemplate.querySelector('[name="regexp"]').value = e.regexp
          ruleTemplate.querySelector('[name="flags"]').value = e.flags
          ruleTemplate.querySelector('[name="replace"]').value = e.replace
        }
        const casingBox = currentDocument.querySelector('#transformations-casing-box')
        if (!casingBox.nextElementSibling.classList.contains('transformation-rule')) {
          casingBox.after(ruleTemplate)
        } else {
          currentDocument.querySelector(':nth-last-child(1 of .transformation-rule)').after(ruleTemplate)
        }
      }

      // Save Transformations button

      modalTemplate.getElementById('transformations-save-button')
        .addEventListener('click', (e) => {
          const modal = e.target.closest('#transformations-modal')
          const transformationsMessageBox = modal.querySelector('#transformations-message-box')
          const rules = []
          let thereIsAnError = false
          Array.from(modal.querySelectorAll('.transformation-rule')).every((rule) => {
            const regexpInput = rule.querySelector('[name="regexp"]')
            const replaceInput = rule.querySelector('[name="replace"]')
            if (!regexpInput.value) {
              thereIsAnError = true
              regexpInput.focus()
              showMessage(transformationsMessageBox, 'The RegExp field must not be empty', 'color-error')
              return false
            } else if (!replaceInput.value) {
              thereIsAnError = true
              replaceInput.focus()
              showMessage(transformationsMessageBox, 'The Replace field must not be empty', 'color-error')
              return false
            } else {
              rules.push({
                flags: rule.querySelector('[name="flags"]').value,
                regexp: regexpInput.value,
                replace: replaceInput.value
              })
              return true
            }
          })
          if (!thereIsAnError) {
            chrome.storage.sync.get(null, (storage) => {
              const searchId = parentLi.getAttribute('data-id')
              storage.fieldsets[searchId].transformations = {
                rules,
                toLowerCase: modal.querySelector('[name="toLowerCase"]').checked,
                toUpperCase: modal.querySelector('[name="toUpperCase"]').checked,
              }
              chrome.storage.sync.set(storage, () => {
                parentLi.setAttribute('data-transformations', JSON.stringify(storage.fieldsets[searchId].transformations))
                showMessage(transformationsMessageBox, 'Saved', 'color-success')
              })
            })
          }
        })

      // Close Transformations modal button

      modalTemplate.getElementById('transformations-modal-close-button')
        .addEventListener('click', () => {
          document.getElementById('transformations-modal').remove()
        })

      // Append Transformations modal

      document.body.appendChild(modalTemplate)
    }
  })

  // Discard Changes

  discardChangesButton.addEventListener('click', () => {
    location.reload()
  })

  async function showDiscardButton() {
    let changed = false
    if (listOfFieldsets.getAttribute('data-show-discard-changes-button')) {
      changed = true
    } else {
      const storage = await chrome.storage.sync.get(null)
      let fieldsets = listOfFieldsets.querySelectorAll('li')
      if (fieldsets.length !== storage.fieldsets.length) {
        changed = true
      } else {
        let fieldsetsNewValues = []
        fieldsets.forEach((fieldset) => {
          let values
          let enabledCheckbox = fieldset.querySelector('[type="checkbox"]')
          if (enabledCheckbox) {
            values = {
              enabled: enabledCheckbox.checked,
              name: fieldset.querySelector('[name="searchName"]').value,
              url: fieldset.querySelector('[name="searchUrl"]').value,
            }
          } else {
            values = { name: '_separator_' }
          }
          fieldsetsNewValues.push(values)
        })
        Array.from(storage.fieldsets).every((fieldset, index) => {
          if (
            (fieldset.name === '_separator_' && fieldsetsNewValues[index].name === '_separator_')
            ||
            (
              fieldset.enabled === fieldsetsNewValues[index]?.enabled
              && fieldset.name === fieldsetsNewValues[index]?.name
              && fieldset.url === fieldsetsNewValues[index].url
            )
          ) {
            return true
          }
          changed = true
          return false
        })
      }
    }
    discardChangesButton.style.display = changed ? 'block' : 'none'
  }

  openInBackgroundCheckbox.addEventListener('change', (e) => {
    chrome.storage.sync.get(null, (storage) => {
      discardChangesButton.style.display = storage.openInBackground !== e.target.checked ? 'block' : 'none'
    })
  })

  addUtmSourceCheckbox.addEventListener('change', (e) => {
    chrome.storage.sync.get(null, (storage) => {
      discardChangesButton.style.display = storage.addUtmSource !== e.target.checked ? 'block' : 'none'
    })
  })

})
