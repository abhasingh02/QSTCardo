// src/mixins/fileMixin.js
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useCharacterStore } from 'src/stores/characterStore'
const store = useCharacterStore()

export default function useFileMixin() {
  const $q = useQuasar()
  /* =====================================================
      EXPORT JSON (browser + cordova)
  ===================================================== */
  const exportFile = (unsaved) => {
    const jsonStr = unsaved || JSON.parse(localStorage.getItem('flashcards'), null, 2)
    const filenameInput = ref('Flashcard')

    $q.dialog({
      title: 'Export File',
      message: 'Enter file name',
      prompt: { model: filenameInput.value, type: 'text' },
      cancel: true,
      persistent: true,
    }).onOk((inputName) => {
      const name = inputName?.trim() || 'MandarinDictionary'
      const finalName = name.endsWith('.json') ? name : name + '.json'

      // Browser export
      if (!window.cordova) {
        const blob = new Blob([jsonStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = finalName
        a.click()
        URL.revokeObjectURL(url)
        return
      }
      // Cordova export
      saveJsonMobile(jsonStr, finalName)
    })
  }
  /* =====================================================
      SAVE JSON (internal storage) + Pinia update
  ===================================================== */
  function saveJsonMobile(jsonStr, finalName) {
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const baseDir = cordova.file.externalDataDirectory || cordova.file.dataDirectory

    window.resolveLocalFileSystemURL(baseDir, (dir) => {
      dir.getDirectory('QSTCardo', { create: true }, (qstDir) => {
        qstDir.getFile(finalName, { create: true }, (file) => {
          file.createWriter((writer) => {
            writer.onwriteend = () => {
              const savedPath = qstDir.nativeURL + finalName

              // Update store
              const fileObj = {
                data: jsonStr,
                name: finalName,
                filename: finalName.replace('.json', ''),
                path: savedPath,
                createdAt: Date.now(),
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
              }
              store.setFlashcards(fileObj)
              $q.notify({ type: 'positive', message: `Backup saved: ${finalName}` })
            }
            writer.onerror = (err) => console.log('Writer error:', err)
            writer.write(blob)
          })
        })
      })
    })
  }

  /* =====================================================
      LOAD EXISTING BACKUPS FROM STORAGE → STORE
  ===================================================== */
  function loadExistingBackupsToStore() {
    if (!window.cordova) return

    const baseDir = cordova.file.externalDataDirectory || cordova.file.dataDirectory

    window.resolveLocalFileSystemURL(baseDir, (dir) => {
      dir.getDirectory('QSTCardo', { create: true }, (qstDir) => {
        const reader = qstDir.createReader()
        reader.readEntries((entries) => {
          const jsonFiles = entries.filter((e) => e.isFile && e.name.endsWith('.json'))

          store.savedFlashcards = jsonFiles.map((f) => ({
            name: f.name,
            filename: f.name.replace('.json', ''),
            path: f.nativeURL,
            createdAt: Date.now(),
          }))
        })
      })
    })
  }

  /* =====================================================
      DELETE BACKUP
  ===================================================== */
  const deleteBackup = (selected) => {
    const list = store.savedFlashcards || []
    // Find the file object using selected value
    const fileObj = list.length && list.find((f) => f.path === selected.path)
    if (!fileObj) {
      return $q.notify({ type: 'warning', message: 'Selected backup not found' })
    }
    // Delete the file
    window.resolveLocalFileSystemURL(fileObj.path, (entry) => {
      entry.remove(
        () => {
          // Remove from the store list
          store.savedFlashcards = list.filter((f) => f.path !== selected)

          $q.notify({
            type: 'positive',
            message: 'Deleting ' + entry.name.replace('.json', ''),
          })
          loadExistingBackupsToStore()
        },
        () => {
          $q.notify({
            type: 'negative',
            message: 'Failed to delete backup',
          })
        },
      )
    })
  }

  /* =====================================================
      EXPORT FUNCTIONS
  ===================================================== */
  return {
    exportFile,
    deleteBackup,
    loadExistingBackupsToStore,
  }
}
