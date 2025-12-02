<template>
  <q-layout view="lHh Lpr lFf">
    <!-- HEADER -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title> QSTCardo </q-toolbar-title>
        <q-btn flat icon="menu">
          <q-menu transition-show="jump-down" transition-hide="jump-up">
            <q-list class="text-secondary" style="min-width: 100px">
              <q-item clickable @click="routePage('/home')">
                <q-btn flat round dense icon="home" />
                <q-item-section>Home</q-item-section>
              </q-item>
              <q-item clickable to="/subscription" v-ripple>
                <q-btn flat round dense icon="card_membership" />
                <q-item-section>Subscription</q-item-section>
              </q-item>
              <q-item clickable @click="exportFile()">
                <q-btn flat round dense icon="save" />
                <q-item-section>Save</q-item-section>
              </q-item>
              <q-item clickable to="/shopping" v-ripple>
                <q-btn flat round dense icon="library_add" />
                <q-item-section>Buy</q-item-section>
              </q-item>
              <q-item clickable @click="exportToJSONBin()">
                <q-btn flat round dense icon="sync" />
                <q-item-section>Cloud</q-item-section>
              </q-item>
              <q-separator />
              <q-item class="text-red" clickable @click="showLogoutDialog = true">
                <q-btn flat round dense icon="logout" />
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
      <!-- LOGOUT CONFIRMATION DIALOG -->
      <q-dialog v-model="showLogoutDialog">
        <q-card>
          <q-card-section class="text-h6"> Confirm Logout </q-card-section>

          <q-card-section> Are you sure you want to logout? </q-card-section>

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

    <!-- FOOTER (optional) -->
    <q-footer class="bg-primary text-center text-grey-8">
      <div class="q-pa-sm text-caption">© 2025 QSTCardo</div>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import CryptoJS from 'crypto-js'
import ImportExportMixin from '../mixins/import-export-mixin.js'
const showLogoutDialog = ref(false)
const router = useRouter()
const $q = useQuasar()
const { exportFile, exportToJSONBin } = ImportExportMixin()

const SECRET_KEY = 'SUPER_SECRET_KEY_12345'

// decrypt function (same as loginPage)
function decrypt(cipher) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY)
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
  } catch (e) {
    console.log('e', e)

    return null
  }
}

// ⭐ Check login when Home button clicked
function routePage(pageName) {
  const encrypted = localStorage.getItem('user')

  if (!encrypted) {
    $q.notify({
      type: 'warning',
      message: 'You must log in first!',
      top: true,
    })
    router.push('/login')
    return
  }

  const user = decrypt(encrypted)

  if (!user || !user.email) {
    $q.notify({
      type: 'negative',
      message: 'Invalid session. Please log in again.',
    })
    localStorage.removeItem('user')
    router.push('/login')
    return
  }

  // User is logged in → go to home
  console.log('pageName', pageName)

  router.push(pageName)
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
