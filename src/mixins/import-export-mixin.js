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
    const data = unsaved || store.newList
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
      const jsonStr = JSON.stringify(data, null, 2)

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
                name: finalName,
                filename: finalName.replace('.json', ''),
                path: savedPath,
                createdAt: Date.now(),
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
    console.log('loading from folder', store.savedFlashcards)

    if (!window.cordova) return

    const baseDir = cordova.file.externalDataDirectory || cordova.file.dataDirectory

    window.resolveLocalFileSystemURL(baseDir, (dir) => {
      dir.getDirectory('QSTCardo', { create: true }, (qstDir) => {
        const reader = qstDir.createReader()
        reader.readEntries((entries) => {
          console.log('entries', entries)

          const jsonFiles = entries.filter((e) => e.isFile && e.name.endsWith('.json'))

          store.savedFlashcards = jsonFiles.map((f) => ({
            name: f.name,
            filename: f.name.replace('.json', ''),
            path: f.nativeURL,
            createdAt: Date.now(),
          }))

          console.log('Backups synced to store:', store.savedFlashcards)
        })
      })
    })
  }

  /* =====================================================
      IMPORT BACKUP
  ===================================================== */
  const importFile = () => {
    const list = store.savedFlashcards || []
    if (!list.length) return $q.notify({ type: 'warning', message: 'No saved backups found' })

    $q.dialog({
      title: 'Import Backup',
      message: 'Select a backup to restore',
      options: {
        type: 'radio',
        model: '',
        items: list.map((f) => ({ label: f.name, value: f.path })),
      },
      cancel: true,
    }).onOk((fileUrl) => {
      window.resolveLocalFileSystemURL(fileUrl, (entry) => {
        entry.file((file) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            try {
              const json = JSON.parse(reader.result)
              store.newList = json
              loadExistingBackupsToStore()
              $q.notify({ type: 'positive', message: 'Backup imported successfully' })
            } catch {
              $q.notify({ type: 'negative', message: 'Invalid JSON file' })
            }
          }
          reader.readAsText(file)
        })
      })
    })
  }

  /* =====================================================
      DELETE BACKUP
  ===================================================== */
  const deleteBackup = () => {
    const list = store.savedFlashcards || []
    if (!list.length) return $q.notify({ type: 'warning', message: 'No saved backups found' })

    $q.dialog({
      title: 'Delete Backup',
      message: 'Select backup to delete',
      options: {
        type: 'radio',
        model: '',
        items: list.map((f) => ({ label: f.name, value: f.path })),
      },
      cancel: true,
    }).onOk((fileUrl) => {
      window.resolveLocalFileSystemURL(fileUrl, (entry) => {
        entry.remove(
          () => {
            store.removeFlashcardByPath(fileUrl)
            $q.notify({ type: 'positive', message: 'Backup deleted' })
          },
          () => $q.notify({ type: 'negative', message: 'Delete failed' }),
        )
      })
    })
  }

  /* =====================================================
      EXPORT FUNCTIONS
  ===================================================== */
  return {
    exportFile,
    importFile,
    deleteBackup,
    loadExistingBackupsToStore,
  }
}
