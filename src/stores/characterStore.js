import { defineStore } from 'pinia'

export const useCharacterStore = defineStore('character', {
  state: () => ({
    newList: [],
    savedFlashcards: [],
    selectedFile: [],
    languageList: [
      { name: 'Hindi', tts: 'hi-IN' },
      { name: 'English', tts: 'en-US' },
      { name: 'Chinese', tts: 'zh-CN' },
      { name: 'Japanese', tts: 'ja-JP' },
      { name: 'Korean', tts: 'ko-KR' },
      { name: 'Arabic', tts: 'ar-SA' },
      { name: 'Spanish', tts: 'es-ES' },
      { name: 'French', tts: 'fr-FR' },
      { name: 'German', tts: 'de-DE' },
      { name: 'Russian', tts: 'ru-RU' },

      // 🇮🇳 Indian languages

      { name: 'Sanskrit', tts: 'hi-IN' }, // spoken using Hindi voice
      { name: 'Marathi', tts: 'mr-IN' },
      { name: 'Nepali', tts: 'ne-NP' },
      { name: 'Gujarati', tts: 'gu-IN' },
      { name: 'Tamil', tts: 'ta-IN' },
      { name: 'Telugu', tts: 'te-IN' },
      { name: 'Kannada', tts: 'kn-IN' },
      { name: 'Malayalam', tts: 'ml-IN' },
      { name: 'Bengali', tts: 'bn-IN' },
      { name: 'Odia', tts: 'or-IN' },
      { name: 'Punjabi', tts: 'pa-IN' },
      { name: 'Assamese', tts: 'as-IN' },
      { name: 'Urdu', tts: 'ur-IN' },
    ],
  }),

  actions: {
    getFlashcards() {
      this.savedFlashcards = JSON.parse(localStorage.getItem('list-of-file'))
      return this.savedFlashcards
    },
    setFlashcards(flashcards) {
      console.log(!window.cordova, 'flashcardssd==xh====', flashcards, this.savedFlashcards)
      if (!window.cordova) {
        const modules = import.meta.glob('/src/data/*.json', { eager: true })
        const files = Object.keys(modules).map((fullPath) => {
          const filename = fullPath.split('/').pop()
          return {
            path: fullPath,
            filename,
          }
        })
        this.savedFlashcards = files
      }
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
