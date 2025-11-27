// src/mixins/fileMixin.js
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useCharacterStore } from 'src/stores/characterStore'
// const $q = useQuasar();
const store = useCharacterStore()

export default function useFileMixin() {
  const $q = useQuasar()
  const exportFile = (data) => {
    const filenameInput = ref('Flashcard')

    $q.dialog({
      title: 'Export File',
      message: 'Enter file name',
      prompt: {
        model: filenameInput.value,
        type: 'text',
      },
      cancel: true,
      persistent: true,
    }).onOk((inputName) => {
      const name = inputName?.trim() || 'MandarinDictionary'
      const finalName = name.endsWith('.json') ? name : name + '.json'
      const jsonStr = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = finalName
      a.click()

      URL.revokeObjectURL(url)
      const newFile = {
        name: finalName,
        filename: name,
        path: 'src/data/' + finalName,
        createdAt: Date.now(),
      }
      store.setFlashcards(newFile)
      $q.notify({ type: 'positive', message: `Exported as ${finalName}` })
    })
  }

  return {
    exportFile,
  }
}
