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
  const transformationRuleTemplate = document.getElementById('transformation-rule-template')
  const loadDefaultsButton = document.getElementById('load-defaults-button')
  const sortAZButton = document.getElementById('sort-a-z-button')
  const importButton = document.getElementById('import-button')
  const exportButton = document.getElementById('export-button')
  const openInBackgroundCheckbox = document.getElementById('open-in-background-checkbox')
  const addUtmSourceCheckbox = document.getElementById('add-utm-source-checkbox')
  const saveButton = document.getElementById('save-button')
  const revertChangesButton = document.getElementById('revert-changes-button')
  const messageBox = document.getElementById('message-box')

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
        let li = newFieldset.querySelector('li')
        newFieldset.querySelector('[name="searchName"]').value = fieldset.name
        newFieldset.querySelector('[name="searchUrl"]').value = fieldset.url
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

  function setDisabledAndTitleAttributes(e) {
    e.setAttribute('disabled', true)
    e.setAttribute('data-title', 'First, save the settings')
  }

  chrome.storage.sync.get(null, (storage) => {
    // Options
    setFieldsets(storage.fieldsets)
    openInBackgroundCheckbox.checked = storage.openInBackground
    addUtmSourceCheckbox.checked = storage.addUtmSource

    // Sortable
    Sortable.create(listOfFieldsets, {
      // [name="searchName"], [name="searchUrl"] doesn't work
      filter: 'input, button, .remove-fieldset-button',
      preventOnFilter: false,
    })
  })

  // Top notification
  chrome.storage.local.get(null, (localStorage) => {
    if (localStorage.updateMessage) {
      topNotification.append(document.createTextNode(localStorage.updateMessage))
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

  // Add Search

  addSearchButton.addEventListener('click', () => {
    const template = fieldsetTemplate.content.cloneNode(true)
    // `data-id` is used when saving Transformations
    template.querySelector('li').setAttribute('data-id', listOfFieldsets.querySelectorAll('[data-id]').length + 2)
    setDisabledAndTitleAttributes(template.querySelector('.transformations-button'))
    listOfFieldsets.appendChild(template)
    listOfFieldsets.querySelector('li:last-child [name="searchName"]').focus()
  })

  // Add Separator

  addSeparatorButton.addEventListener('click', () => {
    listOfFieldsets.appendChild(separatorTemplate.content.cloneNode(true))
  })

  // Load Defaults

  loadDefaultsButton.addEventListener('click', () => {
    chrome.storage.local.get(null, (storage) => {
      setFieldsets(storage.fieldsets)
      openInBackgroundCheckbox.checked = storage.openInBackground
      addUtmSourceCheckbox.checked = storage.addUtmSource
      // To save the Defaults, the user must click the Save button in the Controls block. However, they may open
      // Transformations, change something there, click the Save button in the Transformations modal, and then close or
      // reload the Options page without clicking the Save button in the Controls block. In this case, the loaded
      // Transformations may get attached to a different Search that has, if it has one at all, the same ordinal index
      // as the loaded Search.
      listOfFieldsets.querySelectorAll('.transformations-button').forEach((e) => {
        setDisabledAndTitleAttributes(e)
      })
      revertChangesButton.style.display = 'block'
    })
  })

  // Sort (A-Z)

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
    revertChangesButton.style.display = 'block'
  })

  // Import

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
        listOfFieldsets.querySelectorAll('.transformations-button').forEach((e) => {
          setDisabledAndTitleAttributes(e)
        })
        revertChangesButton.style.display = 'block'
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
        saveAs: true,
      }, () => {})
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
    const newStorage = { fieldsets: [] }
    const fieldsets = listOfFieldsets.querySelectorAll('li')
    let thereIsAnError = false
    Array.from(fieldsets).every((fieldset) => {
      const nameInput = fieldset.querySelector('[name="searchName"]')
      if (nameInput) {
        if (!nameInput.value) {
          messageBox.classList.add('color-error')
          messageBox.textContent = 'The Search name must not be empty'
          nameInput.focus()
          setTimeout(() => {
            messageBox.textContent = ''
            messageBox.classList.remove('color-error')
          }, 1500)
          thereIsAnError = true
          return false
        }
        const urlInput = fieldset.querySelector('[name="searchUrl"]')
        if (!urlInput.value) {
          messageBox.classList.add('color-error')
          messageBox.textContent = 'The Search URL must not be empty'
          urlInput.focus()
          setTimeout(() => {
            messageBox.textContent = ''
            messageBox.classList.remove('color-error')
          }, 1500)
          thereIsAnError = true
          return false
        }
        newStorage.fieldsets.push({
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
        messageBox.classList.add('color-success')
        messageBox.textContent = 'Saved'
        setTimeout(() => {
          messageBox.textContent = ''
          messageBox.classList.remove('color-success')
        }, 1500)
        listOfFieldsets.querySelectorAll('.transformations-button[disabled]').forEach((e) => {
          e.removeAttribute('disabled')
          e.removeAttribute('data-title')
        })
        revertChangesButton.style.display = 'none'
      })
    }
  })

  // Revert Changes

  revertChangesButton.addEventListener('click', () => {
    location.reload()
  })

  // Link to "Load Defaults" button
  document.getElementById('link-to-load-defaults-button')
    .addEventListener('click', (e) => {
      e.preventDefault()
      loadDefaultsButton.focus({ focusVisible: true })
    })

  // Transformations

  listOfFieldsets.addEventListener('click', (e) => {
    if (e.target.classList.contains('transformations-button')) {

      // Modal Template
      const modalTemplate = transformationsModalTemplate.content.cloneNode(true)

      // Parent Li
      const parentLi = e.target.closest('li')

      // Search Name
      modalTemplate.querySelector('#transformations-search-name-box').textContent =
        parentLi.querySelector('[name="searchName"]').value

      // Casing
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

      // Rules

      const transformations = JSON.parse(parentLi.getAttribute('data-transformations'))
      toLowerCaseCheckbox.checked = transformations.toLowerCase
      toUpperCaseCheckbox.checked = transformations.toUpperCase
      transformations.rules.forEach(addRule)

      modalTemplate.getElementById('transformations-add-rule-button')
        .addEventListener('click', addRule)

      function addRule(e) {
        const ruleTemplate = transformationRuleTemplate.content.cloneNode(true)
        // It should be placed before `.after(ruleTemplate)`
        ruleTemplate.querySelector('.remove-transformation-rule-button')
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

      // Save button
      modalTemplate.getElementById('transformations-save-button')
        .addEventListener('click', (e) => {
          const modal = e.target.closest('#transformations-modal')
          const messageBox = modal.querySelector('#transformations-message-box')
          let thereIsAnError = false
          const rules = []
          Array.from(modal.querySelectorAll('.transformation-rule')).every((rule) => {
            const regexpInput = rule.querySelector('[name="regexp"]')
            const replaceInput = rule.querySelector('[name="replace"]')
            if (!regexpInput.value) {
              messageBox.classList.add('color-error')
              messageBox.textContent = 'The RegExp field must not be empty'
              setTimeout(() => {
                messageBox.textContent = ''
                messageBox.classList.remove('color-error')
              }, 1500)
              regexpInput.focus()
              thereIsAnError = true
              return false
            } else if (!replaceInput.value) {
              messageBox.classList.add('color-error')
              messageBox.textContent = 'The Replace field must not be empty'
              setTimeout(() => {
                messageBox.textContent = ''
                messageBox.classList.remove('color-error')
              }, 1500)
              replaceInput.focus()
              thereIsAnError = true
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
                messageBox.classList.add('color-success')
                messageBox.textContent = 'Saved'
                setTimeout(() => {
                  messageBox.textContent = ''
                  messageBox.classList.remove('color-success')
                }, 1500)
                parentLi.setAttribute('data-transformations', JSON.stringify(storage.fieldsets[searchId].transformations))
              })
            })
          }
        })

      // Close modal button
      modalTemplate.getElementById('transformations-close-modal-button')
        .addEventListener('click', () => {
          document.getElementById('transformations-modal').remove()
        })

      // Append
      document.body.appendChild(modalTemplate)
    }
  })

})
