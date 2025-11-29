<template>
  <q-page class="q-pa-md">
    <p class="text-h6">Flashcards</p>
    <div class="q-gutter-sm">
      <div row class="justify-center">
        <q-btn-toggle
          glossy
          v-model="slide"
          :options="[
            { label: 'Create', value: 'Create' },
            { label: 'List', value: 'List' },
            { label: 'View', value: 'View' },
            { label: 'Edit', value: 'Edit' },
          ]"
        />
        <div>
          <q-carousel animated v-model="slide" infinite height="60vh">
            <q-carousel-slide name="Create">
              <div>
                <q-card flat bordered>
                  <q-card-section>
                    <q-btn class="q-mx-sm" color="accent" label="Open" @click="openCard" />
                    <q-btn
                      class="q-mx-sm"
                      color="accent"
                      outline
                      label="Save"
                      @click="saveCardsAndExport"
                    />
                  </q-card-section>
                  <q-card-section class="text-h6">Add Flashcard </q-card-section>
                  <q-card-section>
                    <!-- FRONT -->
                    <div class="col-12 col-sm-6">
                      <q-input v-model="newFront" label="Front" filled bordered />
                      <q-uploader
                        ref="frontUploader"
                        accept="image/*"
                        :max-files="1"
                        label="Upload Front Image (optional)"
                        :factory="() => null"
                        flat
                        bordered
                        class="q-mt-sm"
                        @added="(files) => onImageSelected(files, 'front')"
                      />
                    </div>

                    <!-- BACK -->
                    <div class="col-12 col-sm-6">
                      <q-input v-model="newBack" label="Back" filled bordered />
                      <q-uploader
                        ref="backUploader"
                        accept="image/*"
                        :max-files="1"
                        label="Upload Back Image (optional)"
                        :factory="() => null"
                        flat
                        bordered
                        class="q-mt-sm"
                        @added="(files) => onImageSelected(files, 'back')"
                      />
                    </div>
                  </q-card-section>

                  <q-card-actions align="right">
                    <q-btn color="primary" label="Add" @click="addFlashcard" />
                    <q-btn color="secondary" label="Clear" flat @click="clearInputs" />
                  </q-card-actions>
                </q-card>
                <q-card flat bordered>
                  <q-card-section class="text-h6"> Generate Flashcards From Table </q-card-section>
                  <q-card-section>
                    <q-input
                      v-model="excelPaste"
                      type="textarea"
                      filled
                      autogrow
                      label="Paste rows from Excel (Front | Back)"
                      placeholder="Copy rows from Excel and paste here..."
                      @paste="handleExcelPaste"
                    />
                  </q-card-section>
                  <q-card-actions align="right" class="q-gutter-sm">
                    <q-btn
                      color="primary"
                      icon="upload"
                      label="Upload Excel"
                      @click="triggerFile"
                      flat
                    />
                    <input
                      type="file"
                      ref="excelFileInput"
                      accept=".xlsx,.xls"
                      style="display: none"
                      @change="handleExcelFile"
                    />
                    <q-btn color="primary" label="Generate" @click="generateFromTable" />
                    <q-btn color="primary" outline label="Append" @click="appendFromTable" />
                  </q-card-actions>
                </q-card>
              </div>
            </q-carousel-slide>
            <q-carousel-slide name="List">
              <div class="list-and-view q-gutter-md">
                <q-card flat bordered class="list q-pa-sm">
                  <q-card-section class="row justify-between items-center text-h6">
                    <span>List ({{ showCards?.length }})</span>
                    <q-btn flat icon="refresh" @click="refreshCards" />
                  </q-card-section>

                  <q-list v-if="showCards?.length" separator bordered>
                    <q-item
                      v-for="card in showCards"
                      :key="card.id"
                      clickable
                      :active="card.id === activeId"
                      active-class="bg-blue-1"
                      @click="selectCard(card.id)"
                    >
                      <!-- MAIN TEXT -->
                      <q-item-section>
                        <div class="text-weight-medium" @click.stop="openCard(card)">
                          {{ card.filename }}
                        </div>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card>
              </div>
            </q-carousel-slide>
            <q-carousel-slide name="View">
              <div v-if="active">
                <!-- NAV BUTTONS -->
                <div class="nav-buttons">
                  <q-btn color="primary" outline label="⟨ Prev" @click="prevCard" />
                  <q-btn color="primary" outline label="Next ⟩" @click="nextCard" />
                  <div class="text-caption">{{ activeIndex + 1 }} / {{ flashcards.length }}</div>
                </div>
                <div class="text-center q-mb-sm">
                  <q-btn-dropdown
                    size="sm"
                    color="primary"
                    label="Language"
                    icon="language"
                    bordered
                  >
                    <q-list>
                      <q-item
                        v-for="lang in languageList"
                        :key="lang.code"
                        clickable
                        v-close-popup
                        @click="selectLanguage(lang)"
                      >
                        <q-item-section>{{ lang.name }}</q-item-section>
                      </q-item>
                    </q-list>
                  </q-btn-dropdown>
                  <q-btn color="primary" icon="volume_up" flat @click="speakCharacter" />
                </div>
                <div class="text-center q-mb-sm text-accent">
                  {{ isChinese ? active.pinyin : '' }}
                </div>
                <div class="row items-center justify-between no-wrap">
                  <q-btn size="md" flat icon="arrow_left" color="accent" @click="prevCard" />

                  <div class="flashcard" @click="flip">
                    <div class="card-inner" :class="{ flipped }">
                      <!-- FRONT -->
                      <div class="card-face card-front">
                        <div v-if="active.frontText">
                          {{ active.frontText }}
                        </div>

                        <img
                          v-if="active.frontImage"
                          :src="active.frontImage"
                          style="width: 120px; border-radius: 8px"
                        />
                      </div>

                      <!-- BACK -->
                      <div class="card-face card-back text-pre-line">
                        <div v-if="active.backText">
                          {{ active.backText }}
                        </div>

                        <img
                          v-if="active.backImage"
                          :src="active.backImage"
                          style="width: 120px; border-radius: 8px"
                        />
                      </div>
                    </div>
                  </div>

                  <q-btn size="md" color="accent" flat icon="arrow_right" @click="nextCard" />
                </div>
              </div>

              <div v-else>No card to view</div>
            </q-carousel-slide>

            <q-carousel-slide name="Edit">
              <div class="list-and-view q-gutter-md">
                <q-card flat bordered class="list q-pa-xs">
                  <q-card-section class="row items-center justify-between q-pa-sm bg-grey-2">
                    <section class="col q-ml-lg text-purple items-center">
                      <div class="text-h6">List ({{ filtered.length }})</div>
                    </section>
                    <section>
                      <div class="col">
                        <q-input
                          v-model="query"
                          filled
                          dense
                          clearable
                          placeholder="Search front/back..."
                          prefix="🔍"
                        />
                      </div>
                    </section>
                  </q-card-section>
                  <q-card-section
                    style="position: sticky; top: 0; z-index: 10"
                    class="row items-center justify-between q-pa-sm bg-grey-2"
                  >
                    <div class="row items-center">
                      <q-checkbox
                        v-model="selectAll"
                        class="q-mx-md"
                        :val="filtered"
                        dense
                        @click="toggleSelectAll"
                      />
                    </div>
                    <div>
                      <q-btn
                        size="sm"
                        color="positive"
                        class="col q-mx-lg"
                        label="View"
                        @click="viewSelected"
                      />
                      <q-btn
                        size="sm"
                        color="negative"
                        label="Delete Selected"
                        @click.stop="deleteSelected"
                      />
                    </div>
                  </q-card-section>

                  <q-list separator bordered>
                    <q-item
                      v-for="card in filtered"
                      :key="card.id"
                      clickable
                      :active="card.id === activeId"
                      active-class="bg-blue-1"
                      @click="selectCard(card.id)"
                    >
                      <q-item-section side class="q-pa-xs">
                        <q-checkbox v-model="selectedIds" :val="card.id" dense @click.stop />
                      </q-item-section>
                      <!-- MAIN TEXT -->
                      <q-item-section>
                        <div class="text-weight-medium">
                          {{ card.frontText }}
                        </div>
                      </q-item-section>

                      <!-- ACTIONS -->
                      <q-item-section side class="q-gutter-xs">
                        <q-btn
                          size="sm"
                          color="primary"
                          flat
                          label="Edit"
                          @click.stop="startEdit(card)"
                        />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card>
              </div>
            </q-carousel-slide>
          </q-carousel>
        </div>
      </div>
    </div>
    <q-dialog v-model="editing">
      <q-card class="q-pa-md" style="min-width: 350px; max-width: 500px">
        <q-card-section class="bg-primary text-white text-center">
          <div class="text-h6">Edit Flashcard</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input outlined v-model="editDraft.frontText" label="Front (Term)" dense />
          <q-input
            outlined
            v-model="editDraft.backText"
            label="Back (Definition)"
            type="textarea"
            autogrow
            dense
          />
        </q-card-section>
        <q-separator />
        <q-card-section class="row justify-end q-gutter-sm">
          <q-btn color="primary" unelevated label="Save" @click="applyEdit" />
          <q-btn color="negative" flat label="Cancel" @click="cancelEdit" />
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="columnDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Select Columns</div>
          <div>Choose column for Front and Back</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <!-- FRONT -->
          <q-select
            v-model="frontCol"
            :options="columnOptions"
            label="Front Column"
            outlined
            dense
            emit-value
            map-options
          />

          <!-- BACK -->
          <q-select
            v-model="backCol"
            :options="columnOptions"
            label="Back Column"
            outlined
            dense
            emit-value
            map-options
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="OK" color="primary" @click="confirmColumnSelection" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import * as XLSX from 'xlsx'
import { useCharacterStore } from 'src/stores/characterStore'
import ImportExportMixin from 'src/mixins/import-export-mixin.js'
const { exportFile } = ImportExportMixin()

const store = useCharacterStore()
const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const languageList = store.languageList
const selectedLanguage = ref(null)
const isChinese = computed(() => {
  return selectedLanguage.value?.name === 'Chinese'
})
const STORAGE_KEY = 'flashcards.v1'
const selectAll = ref(false)
const excelFileInput = ref(null)
const excelData = ref([]) // parsed Excel rows
const excelColumns = ref([]) // column names from Excel
const excelColumnOptions = ref([]) // Quasar select-friendly options
const flashcards = ref(loadFromStorage()) || []
const newFront = ref('')
const newBack = ref('')
const excelPaste = ref('')
const query = ref('')
const activeId = ref(flashcards.value.length ? flashcards.value[0].id : null)
const flipped = ref(false)
const slide = route.params.id ? ref('View') : ref('List')
const editing = ref(false)
const editDraft = ref({ id: null, frontText: '', backText: '' })
const selectedIds = ref([])
const tableRows = ref([{ id: uid(), frontText: '', backText: '' }])
const columnDialog = ref(false)
const frontCol = ref(null)
const backCol = ref(null)
const columnOptions = ref([]) // your [{label, value}, ...]
const frontImage = ref(null)
const backImage = ref(null)
const frontUploader = ref(null)
const backUploader = ref(null)
function onImageSelected(files, side) {
  if (side === 'front') frontImage.value = files[0]
  if (side === 'back') backImage.value = files[0]
}

// convert image to Base64
function toBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

async function addFlashcard() {
  let frontImgBase64 = null
  let backImgBase64 = null

  if (frontImage.value) frontImgBase64 = await toBase64(frontImage.value)
  if (backImage.value) backImgBase64 = await toBase64(backImage.value)

  const card = {
    id: Date.now(),
    frontText: newFront.value || null,
    backText: newBack.value || null,
    frontImage: frontImgBase64,
    backImage: backImgBase64,
  }

  flashcards.value.push(card)

  // save to localStorage
  localStorage.setItem('flashcards', JSON.stringify(flashcards.value))

  clearInputs()
}

function clearInputs() {
  newFront.value = ''
  newBack.value = ''
  frontImage.value = null
  backImage.value = null
  if (frontUploader.value) {
    frontUploader.value.reset()
  }
  if (backUploader.value) {
    backUploader.value.reset()
  }
}

onMounted(() => {
  store.setFlashcards()
  window.addEventListener('keydown', handleArrow)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleArrow)
})
function triggerFile() {
  excelFileInput.value.click()
}

function refreshCards() {
  store.setFlashcards()
}

function handleExcelFile(e) {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (evt) => {
    const data = new Uint8Array(evt.target.result)
    const workbook = XLSX.read(data, { type: 'array' })

    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 })

    excelColumns.value = json[0] // ["Simplified", "Traditional", "Pinyin", "English"]
    excelData.value = json.slice(1)

    excelColumnOptions.value = json[0].map((h) => ({
      label: String(h),
      value: String(h),
    }))

    askColumnSelection()
  }

  reader.readAsArrayBuffer(file)
}

function askColumnSelection() {
  columnOptions.value = excelColumns.value.map((h) => ({
    label: String(h),
    value: String(h),
  }))

  columnDialog.value = true
}
function confirmColumnSelection() {
  if (!frontCol.value || !backCol.value) {
    $q.notify({ type: 'warning', message: 'Please select both columns' })
    return
  }

  createFlashcardsFromExcel(frontCol.value, backCol.value)
  columnDialog.value = false
}

function createFlashcardsFromExcel(frontCol, backCol) {
  const frontIndex = excelColumns.value.indexOf(frontCol)
  const backIndex = excelColumns.value.indexOf(backCol)

  if (frontIndex === -1) return
  if (backIndex === -1) return

  const list = excelData.value
    .map((row) => ({
      id: uid(),
      createdAt: Date.now(),
      frontText: String(row[frontIndex] || '').trim(),
      backText: String(row[backIndex] || '').trim(),
    }))
    .filter((r) => r.frontText !== '')

  flashcards.value = list
  activeId.value = list.length ? list[0].id : null

  $q.notify({
    type: 'positive',
    message: `Imported ${list.length} flashcards`,
  })
}

function handleExcelPaste() {
  setTimeout(() => {
    convertExcelToRows(excelPaste.value)
    excelPaste.value = ''
  }, 30)
}
function convertExcelToRows(text) {
  if (!text.trim()) return

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  for (const line of lines) {
    const [frontText, backText] = line.split('\t') // Excel uses TAB separator
    tableRows.value.push({
      id: uid(),
      frontText: (frontText || '').trim(),
      backText: (backText || '').trim(),
    })
  }
}
function generateFromTable() {
  const list = tableRows.value
    .filter((r) => r.frontText.trim() !== '')
    .map((r) => ({
      id: uid(),
      createdAt: Date.now(),
      frontText: r.frontText.trim(),
      backText: r.backText.trim(),
    }))
  if (!list.length) return
  flashcards.value = list
  activeId.value = flashcards.value[0].id
}
function appendFromTable() {
  const list = tableRows.value
    .filter((r) => r.frontText.trim() !== '')
    .map((r) => ({
      id: uid(),
      createdAt: Date.now(),
      frontText: r.frontText.trim(),
      backText: r.backText.trim(),
    }))
  if (!list.length) return
  flashcards.value = list.concat(flashcards.value)
  activeId.value = list[0].id
}

function handleArrow(e) {
  if (e.key === 'ArrowLeft') {
    prevCard()
  }
  if (e.key === 'ArrowRight') {
    nextCard()
  }
  if (e.key === 'ArrowDown') {
    flipped.value = !flipped.value
  }
  if (e.key === 'ArrowUp') {
    speakCharacter()
  }
}

watch(selectedIds, () => {
  if (selectedIds.value.length === filtered.value.length) {
    selectAll.value = true
  } else {
    selectAll.value = false
  }
})

watch(selectAll, (val) => {
  console.log('selectAll changed', val)
  if (val) {
    $q.notify({
      type: 'warning',
      message: 'All cards selected',
      position: 'top',
      timeout: 0, // stays until user clicks OK
      actions: [
        {
          label: 'OK',
          color: 'white',
          handler: () => {},
        },
      ],
    })
  }
})

watch(flashcards, (val) => saveToStorage(val), { deep: true })
watch(slide, (val) => {
  if (val === 'List') {
    store.setFlashcards()
  }
})

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (e) {
    console.warn('Failed to load flashcards', e)
    return []
  }
}
const selectLanguage = (lang) => {
  selectedLanguage.value = lang
}
const speakCharacter = () => {
  const utterance = new SpeechSynthesisUtterance(active.value.frontText)
  utterance.lang = selectedLanguage.value?.tts || 'en-US'
  utterance.pitch = 1
  utterance.rate = 0.5
  speechSynthesis.speak(utterance)
  $q.notify({ type: 'positive', color: 'blue', message: 'Speaking ' + active.value.frontText })
}

const showCards = computed(() => {
  const selectCards = store.savedFlashcards
  const cards = selectCards && selectCards.length ? selectCards : []
  return cards
})

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to save flashcards', e)
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// function addFlashcard() {
//   const frontText = (newFront.value || '').trim()
//   const backText = (newBack.value || '').trim()
//   if (!frontText && !backText) return
//   const card = { id: uid(), frontText, backText, createdAt: Date.now() }
//   flashcards.value.unshift(card)
//   clearInputs()
//   activeId.value = card.id
//   flipped.value = false
// }

function toggleSelectAll() {
  console.log('selectAll', selectAll, selectedIds.value.length, filtered.value.length)
  if (selectAll.value) {
    selectedIds.value = filtered.value.map((c) => c.id)
  } else {
    selectedIds.value = []
  }
}

function deleteSelected() {
  if (selectedIds.value.length === 0) {
    $q.notify({ type: 'warning', message: 'No card selected to delete' })
    return
  } else if (selectedIds.value.length === filtered.value.length) {
    $q.dialog({
      title: 'Confirm Delete',
      message: `Delete <span style="color: red; font-weight: bold;">ALL</span> flashcards? This cannot be undone.`,
      html: true,
      ok: {
        label: 'Delete',
        color: 'negative',
      },
      cancel: {
        label: 'Cancel',
      },
      persistent: true,
    }).onOk(() => {
      flashcards.value = []
      activeId.value = null
      selectAll.value = false
    })
  } else {
    $q.dialog({
      title: 'Confirm Delete',
      message: selectedIds.value.length + ' card(s) will be deleted. This cannot be undone.',
      ok: { label: 'Delete', color: 'negative' },
      cancel: { label: 'Cancel' },
      persistent: true,
    }).onOk(() => {
      selectedIds.value.forEach((id) => {
        const idx = flashcards.value.findIndex((c) => c.id === id)
        if (idx !== -1) {
          flashcards.value.splice(idx, 1)

          // If deleted card was active, set next active card (or null)
          if (activeId.value === id) {
            activeId.value = flashcards.value.length ? flashcards.value[0].id : null
          }
        }
      })
      selectedIds.value = [] // Clear selected IDs after deletion
      selectAll.value = false
    })
  }
}

function viewSelected() {
  if (selectedIds.value.length === 0) {
    $q.notify({ type: 'warning', message: 'No card selected to view' })
    return
  } else {
    $q.dialog({
      title: 'Cards to View',
      message: selectedIds.value.length + ' card(s) are selected. View only these cards?',
      ok: { label: 'View', color: 'positive' },
      cancel: { label: 'Cancel' },
      persistent: true,
    }).onOk(() => {
      const selectedCards = flashcards.value.filter((c) => selectedIds.value.includes(c.id))
      if (selectedCards.length === 0) {
        $q.notify({ type: 'warning', message: 'Selected cards not found' })
        return
      }
      flashcards.value = selectedCards
      activeId.value = selectedCards[0].id
      slide.value = 'View'
    })
  }
  selectAll.value = false
}

function startEdit(card) {
  editing.value = true
  editDraft.value = { id: card.id, frontText: card.frontText, backText: card.backText }
}

function applyEdit() {
  const draft = editDraft.value
  const i = flashcards.value.findIndex((c) => c.id === draft.id)
  if (i !== -1) {
    flashcards.value[i].frontText = (draft.frontText || '').trim()
    flashcards.value[i].backText = (draft.backText || '').trim()
  }
  editing.value = false
}

function cancelEdit() {
  editing.value = false
}

function saveCardsAndExport() {
  let filteredData = flashcards.value
  if (!filteredData.length) {
    $q.notify({ type: 'negative', color: 'red', message: 'No matching characters to save' })
    return
  } else {
    store.saveNewList(filteredData)
    exportFile(filteredData)
    $q.notify({ type: 'positive', color: 'red', message: 'Saved' })
  }
}

function openCard(selected) {
  console.log('selected', selected.path)

  // If "selected" contains a predefined path, load JSON directly
  if (selected && selected.path) {
    fetch(selected.path)
      .then((res) => {
        if (!res.ok) throw new Error('File not found: ' + selected.path)
        return res.json()
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Invalid JSON format')

        const items = data.map((c) => ({
          id: c.id || uid(),
          frontText: c.symbol || '',
          backText: c.meaning || '',
          pinyin: c.pinyin,
          createdAt: Date.now(),
        }))

        flashcards.value = items
        activeId.value = items[0]?.id || null
      })
      .catch((err) => {
        alert('Failed to load JSON: ' + err.message)
      })

    return // Stop here—do not trigger file input
  }
  const inp = document.createElement('input')
  inp.type = 'file'
  inp.accept = 'application/json'
  inp.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!Array.isArray(data)) throw new Error('Invalid format')
        const items = data.map((c) => ({
          id: c.id || uid(),
          frontText: c.symbol || '',
          backText: c.meaning || '',
          pinyin: c.pinyin,
          createdAt: Date.now(),
        }))
        flashcards.value = items
        activeId.value = items[0].id
      } catch (err) {
        alert('Failed to import JSON: ' + err.message)
      }
    }
    reader.readAsText(file)
  }
  inp.click()
  $q.notify({ type: 'positive', color: 'blue', message: 'Flashcard file imported' })
}

const filtered = computed(() => {
  const q = (query.value || '').toLowerCase().trim()
  if (!q) return flashcards.value
  return flashcards.value.filter(
    (c) =>
      (c.frontText || '').toLowerCase().includes(q) || (c.backText || '').toLowerCase().includes(q),
  )
})

const active = computed(() => {
  const symbolView = flashcards.value.find((c) => c.id === activeId.value)
  if (activeId.value) router.replace(`/flashcard/${activeId.value}`)
  return symbolView || null
})
const activeIndex = computed(() => {
  return Math.max(
    0,
    flashcards.value.findIndex(
      (c) => c.id === (activeId.value || (flashcards.value[0] && flashcards.value[0].id)),
    ),
  )
})

function selectCard(id) {
  activeId.value = id
  flipped.value = false
}

function flip() {
  flipped.value = !flipped.value
}

function prevCard() {
  if (!flashcards.value.length) return
  const idx = flashcards.value.findIndex((c) => c.id === activeId.value)
  const nextIdx = idx <= 0 ? flashcards.value.length - 1 : idx - 1
  activeId.value = flashcards.value[nextIdx].id
  flipped.value = false
}

function nextCard() {
  if (!flashcards.value.length) return
  const idx = flashcards.value.findIndex((c) => c.id === activeId.value)
  const nextIdx = idx === -1 || idx >= flashcards.value.length - 1 ? 0 : idx + 1
  activeId.value = flashcards.value[nextIdx].id
  flipped.value = false
}
</script>
<style scoped>
/* navigation buttons */
.nav-buttons {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Reduce flashcard height for mobile */
.flashcard {
  width: 100%;
  max-width: 250px;
  height: 350px; /* ↓ smaller so it fits screen */
  max-height: 400px;
  perspective: 1000px;
  margin: auto;
}

.card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.card-inner.flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem; /* slightly smaller for mobile */
  border-radius: 12px;
  backface-visibility: hidden;
}

.card-front {
  background: #d6e8fa;
  border: 1px solid #e6f0ff;
}

.card-back {
  background: #fbe7db;
  transform: rotateY(180deg);
}
</style>
