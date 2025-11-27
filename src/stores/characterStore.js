import { defineStore } from 'pinia'

export const useCharacterStore = defineStore('character', {
  state: () => ({
    newList: [],
    savedFlashcards: [],
    selectedFile: [],
  }),

  actions: {
    getFlashcards() {
      this.savedFlashcards = JSON.parse(localStorage.getItem('list-of-file'))
      return this.savedFlashcards
    },
    setFlashcards(flashcards) {
      const modules = import.meta.glob('/src/data/*.json', { eager: true })
      const files = Object.keys(modules).map((fullPath) => {
        const filename = fullPath.split('/').pop()
        return {
          path: fullPath,
          filename,
        }
      })
      this.savedFlashcards = files
      if (flashcards) {
        this.savedFlashcards.find((f) => f.filename === flashcards.filename) ||
          this.savedFlashcards.push(flashcards)
      }
      localStorage.setItem('list-of-file', JSON.stringify(this.savedFlashcards))
    },

    saveNewList(newList) {
      this.newList = newList
      // console.log('saveNewList(fileContents)', this.newList)
    },
  },
})
