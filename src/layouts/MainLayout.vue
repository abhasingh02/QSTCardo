<template>
  <q-layout view="lHh Lpr lFf">
    <!-- HEADER -->
    <q-header elevated class="header-beauty">
      <q-toolbar class="header-toolbar">
        <!-- APP ICON -->
        <q-avatar size="36px" rounded class="app-logo">
          <q-icon name="style" size="26px" />
        </q-avatar>

        <!-- TITLE -->
        <q-toolbar-title class="header-title"> QSTCardo </q-toolbar-title>
        <q-btn v-if="developerMode" @click="resetApp()">reset</q-btn>
        <!-- MENU -->
        <q-btn flat icon="menu">
          <q-menu transition-show="jump-down" transition-hide="jump-up">
            <q-list class="text-secondary" style="min-width: 160px">
              <q-item clickable v-close-popup v-ripple @click="routePage('home')">
                <q-item-section avatar><q-icon name="home" /></q-item-section>
                <q-item-section>Home</q-item-section>
              </q-item>

              <q-item clickable v-close-popup v-ripple @click="routePage('subscription')">
                <q-item-section avatar><q-icon name="card_membership" /></q-item-section>
                <q-item-section>Subscription</q-item-section>
              </q-item>

              <q-item clickable v-close-popup v-ripple @click="routePage('save')">
                <q-item-section avatar><q-icon name="save" /></q-item-section>
                <q-item-section>Save</q-item-section>
              </q-item>

              <q-item clickable v-close-popup v-ripple @click="routePage('shopping')">
                <q-item-section avatar><q-icon name="library_add" /></q-item-section>
                <q-item-section>Buy</q-item-section>
              </q-item>

              <q-item clickable v-close-popup v-ripple @click="routePage('cloud')">
                <q-item-section avatar><q-icon name="sync" /></q-item-section>
                <q-item-section>Cloud</q-item-section>
              </q-item>

              <q-separator />

              <q-item clickable v-ripple class="text-red" @click="showLogoutDialog = true">
                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>

      <!-- LOGOUT DIALOG -->
      <q-dialog v-model="showLogoutDialog">
        <q-card>
          <q-card-section class="text-h6">Confirm Logout</q-card-section>

          <q-card-section>Are you sure you want to logout?</q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="No" color="primary" v-close-popup />
            <q-btn flat label="Yes" color="negative" @click="logout" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-header>

    <!-- MAIN CONTENT -->
    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- FOOTER -->

    <q-footer class="footer-beauty">
      <div class="footer-inner text-caption">© 2025 QSTCardo</div>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import CryptoJS from 'crypto-js'
import Filemixin from '../mixins/Filemixin.js'
import { useCardStore } from 'src/stores/cardStore'
const store = useCardStore()

const router = useRouter()
const $q = useQuasar()
// const developerMode = ref(true)
const developerMode = ref(false)

onMounted(() => {})
function resetApp() {
  store.reset()
}
const showLogoutDialog = ref(false)

const { exportFile } = Filemixin()

const SECRET_KEY = 'SUPER_SECRET_KEY_12345'

function decrypt(cipher) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY)
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
  } catch {
    return null
  }
}

function routePage(action) {
  const encrypted = localStorage.getItem('user')

  if (!encrypted) {
    $q.notify({ type: 'warning', message: 'You must log in first!' })
    router.push('/login')
    return
  }

  const user = decrypt(encrypted)

  // Validate username + password
  if (!user || !user.username || !user.password) {
    $q.notify({ type: 'negative', message: 'Invalid session. Please log in again.' })
    localStorage.removeItem('user')
    router.push('/login')
    return
  }

  switch (action) {
    case 'home':
      router.push('/home')
      break
    case 'subscription':
      router.push('/subscription')
      break
    case 'shopping':
      router.push('/shopping')
      break
    case 'save':
      exportFile()
      break
    case 'cloud':
      // exportToJSONBin()
      $q.notify({
        type: 'warning',
        message: 'Not implemented',
        position: 'top',
      })
      break
  }
}

function logout() {
  showLogoutDialog.value = false
  localStorage.removeItem('user')
  $q.notify({ type: 'positive', message: 'Logged out successfully!' })
  router.push('/login')
}
</script>

<style>
.q-layout {
  min-height: 100vh;
}
</style>
