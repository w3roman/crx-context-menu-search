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
        let li = fieldset.querySelector('li')
        li.setAttribute('data-id', index)
        fieldset.querySelector('[name="searchName"]').value = fieldsets[index].name
        fieldset.querySelector('[name="searchUrl"]').value = fieldsets[index].url
        if (fieldsets[index].transformations) {
          // We tie the transformations to the <li>, since on deletion and subsequent saving the indices get overwritten
          li.setAttribute('data-transformations', JSON.stringify(fieldsets[index].transformations))
        }
      }
      listOfFieldsets.appendChild(fieldset)
    }
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
  })

  listOfFieldsets.addEventListener('click', (e) => {
    if (e.target.classList.contains('transformations-button')) {

      const modalTemplate = transformationsModalTemplate.content.cloneNode(true)
      const parentLi = e.target.closest('li')

      // Search ID
      const searchId = parentLi.getAttribute('data-id')
      modalTemplate.getElementById('transformations-modal').setAttribute('data-id', searchId)

      // Search name
      const searchNameBox = modalTemplate.querySelector('#transformations-search-name-box')
      searchNameBox.textContent = searchNameBox.textContent.replace(
        'name',
        parentLi.querySelector('[name="searchName"]').value
      )

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
      // The definition of the var `noRuleExists` must be here to avoid
      // the "Cannot access 'noRuleExists' before initialization" error
      let noRuleExists = true
      const transformations = JSON.parse(parentLi.getAttribute('data-transformations'))
      if (transformations) {
        toLowerCaseCheckbox.checked = transformations.toLowerCase
        toUpperCaseCheckbox.checked = transformations.toUpperCase
        transformations.rules.forEach(addRule)
      }
      modalTemplate.getElementById('transformations-add-rule-button').addEventListener('click', addRule)
      function addRule(e) {
        const ruleTemplate = transformationRuleTemplate.content.cloneNode(true)
        // It should be placed before `.after(ruleTemplate)`
        ruleTemplate.querySelector('.remove-transformation-rule-button').addEventListener('click', (e) => {
          e.target.closest('.transformation-rule').remove()
        })
        let currentDocument
        if (e instanceof PointerEvent) {
          currentDocument = document
        } else {
          currentDocument = modalTemplate
          ruleTemplate.querySelector('[name="regexp"]').value = e.regexp
          ruleTemplate.querySelector('[name="flags"]').value = e.flags
          ruleTemplate.querySelector('[name="replace"]').value = e.replace
        }
        const casingBox = currentDocument.querySelector('#transformations-casing-box')
        if (noRuleExists || !casingBox.nextElementSibling.classList.contains('transformation-rule')) {
          casingBox.after(ruleTemplate)
          noRuleExists = false
        } else {
          currentDocument.querySelector(':nth-last-child(1 of .transformation-rule)').after(ruleTemplate)
        }
      }

      // Save button
      modalTemplate.getElementById('transformations-save-button').addEventListener('click', (e) => {
        const modal = e.target.closest('#transformations-modal')
        const toLowerCase = modal.querySelector('[name="toLowerCase"]').checked
        const toUpperCase = modal.querySelector('[name="toUpperCase"]').checked
        const messageBox = modal.querySelector('#transformations-message-box')
        const rules = []
        let hasError = false
        Array.from(modal.querySelectorAll('.transformation-rule')).every((rule) => {
          const flagsField = rule.querySelector('[name="flags"]')
          const regexpField = rule.querySelector('[name="regexp"]')
          const replaceField = rule.querySelector('[name="replace"]')
          if (!regexpField.value) {
            messageBox.textContent = 'The "RegExp" field must not be empty'
            regexpField.focus()
            setTimeout(() => {
              messageBox.textContent = ''
            }, 1500)
            hasError = true
            return false
          } else if (!replaceField.value) {
            messageBox.textContent = 'The "Replace" field must not be empty'
            replaceField.focus()
            setTimeout(() => {
              messageBox.textContent = ''
            }, 1500)
            hasError = true
            return false
          } else {
            rules.push({ flags: flagsField.value, regexp: regexpField.value, replace: replaceField.value })
            return true
          }
        })
        if (!hasError) {
          chrome.storage.sync.get(null, (storage) => {
            storage.fieldsets[searchId].transformations = { rules, toLowerCase, toUpperCase }
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

      // Close modal button
      modalTemplate.getElementById('transformations-close-modal-button').addEventListener('click', () => {
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
    Array.from(fieldsets).forEach((fieldset) => {
      const nameField = fieldset.querySelector('[name="searchName"]')
      if (nameField) {
        unorderedFieldsets[nameField.value] = fieldset
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
        addUtmSourceCheckbox.checked = storage.addUtmSource
        openInBackgroundCheckbox.checked = storage.openInBackground
        listOfFieldsets.setAttribute('data-imported', true)
        // To save the import, the user must click the Save button in the Controls block. However, they may open Transformations, change something there, click the Save button in the Transformations modal, and then close the Options without clicking the Save button in the Controls block. In this case, the imported Transformations may get attached to a different Search that has, if it has one at all, the same ordinal index as the imported Search.
        listOfFieldsets.querySelectorAll('.transformations-button').forEach((e) => {
          e.setAttribute('disabled', true)
        })
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
      }, () => {})
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
      const newStorage = { fieldsets: [] }
      const fieldsets = listOfFieldsets.querySelectorAll('li')

      let hasError = false
      Array.from(fieldsets).every((fieldset) => {
        const nameInput = fieldset.querySelector('[name="searchName"]')
        if (nameInput) {
          if (!nameInput.value) {
            messageBox.textContent = 'The Search name must not be empty'
            nameInput.focus()
            setTimeout(() => {
              messageBox.textContent = ''
            }, 1500)
            hasError = true
            return false
          }
          const urlInput = fieldset.querySelector('[name="searchUrl"]')
          if (!urlInput.value) {
            messageBox.textContent = 'The Search URL must not be empty'
            urlInput.focus()
            setTimeout(() => {
              messageBox.textContent = ''
            }, 1500)
            hasError = true
            return false
          }
          const searchId = fieldset.getAttribute('data-id')
          let transformations
          if (listOfFieldsets.getAttribute('data-load-defaults')) {
            transformations = { rules: [], toLowerCase: false, toUpperCase: false }
          } else if (listOfFieldsets.getAttribute('data-imported')) {
            transformations = JSON.parse(fieldset.getAttribute('data-transformations'))
          } else {
            // ?.transformations is required when adding a new Search
            transformations = {
              rules: storage.fieldsets[searchId]?.transformations?.rules || [],
              toLowerCase: storage.fieldsets[searchId]?.transformations?.toLowerCase || false,
              toUpperCase: storage.fieldsets[searchId]?.transformations?.toUpperCase || false,
            }
          }
          newStorage.fieldsets.push({ name: nameInput.value, transformations, url: urlInput.value })
        } else {
          newStorage.fieldsets.push({ name: '_separator_' })
        }
        return true
      })

      if (hasError) return

      newStorage.openInBackground = openInBackgroundCheckbox.checked
      newStorage.addUtmSource = addUtmSourceCheckbox.checked
      chrome.storage.sync.set(newStorage, () => {
        messageBox.textContent = 'Saved'
        setTimeout(() => {
          messageBox.textContent = ''
        }, 1500)
        listOfFieldsets.querySelectorAll('.transformations-button[disabled]').forEach((e) => {
          e.removeAttribute('disabled')
        })
        listOfFieldsets.removeAttribute('data-load-defaults')
        listOfFieldsets.removeAttribute('data-imported')
      })
    })
  })

  // Link to "Load Defaults" button

  document.getElementById('link-to-load-defaults-button').addEventListener('click', (e) => {
    e.preventDefault()
    loadDefaultsButton.focus()
  })

})
