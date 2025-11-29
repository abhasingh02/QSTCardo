<template>
  <q-page class="row justify-center items-center q-pa-md bg-grey-2">
    <q-card class="q-pa-lg shadow-4" style="width: 400px; max-width: 95%">
      <!-- Title -->
      <div class="text-h5 text-center q-mb-md">🔐 Login / Signup</div>

      <!-- EMAIL FORM -->
      <q-form class="q-gutter-md">
        <!-- Email -->
        <q-input filled v-model="email" label="Email" type="email" prepend-icon="mail" />

        <!-- Password -->
        <q-input
          filled
          v-model="password"
          label="Password"
          :type="showPassword ? 'text' : 'password'"
          prepend-icon="lock"
        >
          <template #append>
            <q-icon
              :name="showPassword ? 'visibility' : 'visibility_off'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <!-- Login -->
        <q-btn label="Login" color="primary" class="full-width" @click="handleEmailLogin" />

        <!-- Signup -->
        <q-btn label="Signup" color="secondary" class="full-width q-mt-sm" @click="handleSignup" />
      </q-form>

      <!-- Divider -->
      <div class="text-center q-mt-md text-grey">───── Or Continue With ─────</div>

      <!-- GOOGLE LOGIN -->
      <q-btn
        color="white"
        text-color="black"
        class="full-width q-mt-md"
        unelevated
        no-caps
        @click="handleGoogleSignup"
      >
        <img
          src="https://developers.google.com/identity/images/g-logo.png"
          style="width: 20px; margin-right: 10px"
        />
        Sign up / Login with Google
      </q-btn>

      <q-btn
        color="primary"
        icon="fingerprint"
        label="Login with Fingerprint"
        class="full-width q-mt-sm"
        @click="handleBiometricLogin"
      />
    </q-card>
  </q-page>
</template>

<script setup>
/* global Fingerprint */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import CryptoJS from 'crypto-js'

const router = useRouter()

const $q = useQuasar()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

// AES Secret Key
const SECRET_KEY = 'SUPER_SECRET_KEY_12345'

// AES Methods
function encrypt(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString()
}
function decrypt(cipher) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY)
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
  } catch {
    return null
  }
}

// Google Login
const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com'

onMounted(() => {
  autoLogin()
  const wait = setInterval(() => {
    if (window.googleReady && window.google) {
      clearInterval(wait)
      initGoogle()
    }
  }, 200)
})

function autoLogin() {
  const saved = localStorage.getItem('user')
  const fingerEnabled = localStorage.getItem('fingerEnabled') === 'true'
  if (saved && fingerEnabled) {
    setTimeout(() => {
      handleBiometricAutoLogin()
    }, 500)
  }
}

function initGoogle() {
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleResponse,
  })

  console.log('Google Login Initialized')
}

function handleGoogleSignup() {
  if (!window.googleReady) {
    $q.notify({ type: 'negative', message: 'Google SDK not loaded yet' })
    return
  }
  window.google.accounts.id.prompt()
}

function handleGoogleResponse(response) {
  const idToken = response.credential
  const payload = JSON.parse(atob(idToken.split('.')[1]))

  let usersDb = JSON.parse(localStorage.getItem('usersDb') || '[]')
  const exists = usersDb.find((u) => u.email === payload.email)

  if (!exists) {
    usersDb.push({
      email: payload.email,
      googleId: payload.sub,
      name: payload.name,
      picture: payload.picture,
    })
    localStorage.setItem('usersDb', JSON.stringify(usersDb))
    $q.notify({ type: 'positive', message: `Account created for ${payload.name}` })
  } else {
    $q.notify({ type: 'positive', message: `Welcome back ${exists.email}` })
  }

  localStorage.setItem('user', encrypt({ email: payload.email }))
  localStorage.setItem('fingerEnabled', 'true') // auto-enable fingerprint
  router.push('/home')
}

function handleSignup() {
  if (!email.value || !password.value) {
    $q.notify({ type: 'negative', message: 'Enter email and password' })
    return
  }

  let usersDb = JSON.parse(localStorage.getItem('usersDb') || '[]')

  if (usersDb.find((u) => u.email === email.value)) {
    $q.notify({ type: 'negative', message: 'Email already exists' })
    return
  }

  usersDb.push({
    email: email.value,
    password: encrypt(password.value),
  })

  localStorage.setItem('usersDb', JSON.stringify(usersDb))

  $q.notify({ type: 'positive', message: 'Signup successful!' })

  localStorage.setItem('user', encrypt({ email: email.value }))
  localStorage.setItem('fingerEnabled', 'true') // enable fingerprint automatically
  router.push('/home')
}

// ----------------------------
// EMAIL LOGIN
// ----------------------------
function handleEmailLogin() {
  let usersDb = JSON.parse(localStorage.getItem('usersDb') || '[]')
  const exists = usersDb.find((u) => u.email === email.value)

  if (!exists) {
    $q.notify({ type: 'negative', message: 'No account found' })
    return
  }

  if (exists.password) {
    const decryptedPass = decrypt(exists.password)
    if (decryptedPass !== password.value) {
      $q.notify({ type: 'negative', message: 'Incorrect password' })
      return
    }
  }

  $q.notify({ type: 'positive', message: 'Login successful!' })
  localStorage.setItem('user', encrypt({ email: email.value }))
  localStorage.set
  router.push('/home')
}

// ----------------------------
// FINGERPRINT LOGIN
// ----------------------------
async function handleBiometricLogin() {
  const saved = localStorage.getItem('user')
  if (!saved) {
    $q.notify({
      type: 'negative',
      message: 'Login with Email/Google once before using Fingerprint',
    })
    return
  }

  try {
    await Fingerprint.isAvailable()

    await Fingerprint.show({
      title: 'Fingerprint Login',
      subtitle: 'Authenticate to continue',
      description: 'Use your fingerprint',
      disableBackup: true,
    })

    router.push('/home')
    $q.notify({ type: 'positive', message: 'Logged in with fingerprint!' })
  } catch {
    $q.notify({ type: 'negative', message: 'Authentication failed' })
  }
}

// ----------------------------
// AUTO FINGERPRINT LOGIN
// ----------------------------
async function handleBiometricAutoLogin() {
  try {
    await Fingerprint.isAvailable()

    await Fingerprint.show({
      title: 'Welcome Back!',
      subtitle: 'Fingerprint Required',
      description: 'Authenticate to continue',
      disableBackup: true,
    })

    router.push('/home')
  } catch {
    $q.notify({ type: 'warning', message: 'Fingerprint required to continue' })
  }
}
</script>

<style scoped>
.bg-grey-2 {
  background-color: #f5f5f5;
}
</style>
