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
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import CryptoJS from 'crypto-js'

const router = useRouter()

const $q = useQuasar()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

// AES Secret Key (CHANGE this)
const SECRET_KEY = 'SUPER_SECRET_KEY_12345'

function encrypt(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString()
}

function decrypt(cipher) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY)
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
  } catch (e) {
    console.log('e', e)

    return null
  }
}
const GOOGLE_CLIENT_ID = 'YOUR_REAL_CLIENT_ID.apps.googleusercontent.com'

onMounted(() => {
  logout()
  const wait = setInterval(() => {
    if (window.googleReady && window.google) {
      clearInterval(wait)
      initGoogle()
    }
  }, 200)
})

function initGoogle() {
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleResponse,
  })

  console.log('Google Initialized!')
}

function handleGoogleSignup() {
  if (!window.googleReady) {
    $q.notify({ type: 'negative', message: 'Google not loaded yet...' })
    return
  }

  window.google.accounts.id.prompt()
}

// GOOGLE LOGIN / SIGNUP
function handleGoogleResponse(response) {
  const idToken = response.credential
  const user = JSON.parse(atob(idToken.split('.')[1]))

  let usersDb = JSON.parse(localStorage.getItem('usersDb') || '[]')

  const exists = usersDb.find((u) => u.email === user.email)

  if (!exists) {
    usersDb.push({
      email: user.email,
      googleId: user.sub,
      name: user.name,
      picture: user.picture,
    })

    localStorage.setItem('usersDb', JSON.stringify(usersDb))

    $q.notify({ type: 'positive', message: `Account created for ${user.name}` })
  } else {
    $q.notify({ type: 'positive', message: `Welcome back ${exists.email}` })
  }

  localStorage.setItem('user', encrypt({ email: user.email }))

  router.push('/home')
}

// EMAIL SIGNUP (store encrypted password)
function handleSignup() {
  if (!email.value || !password.value) {
    $q.notify({ type: 'negative', message: 'Enter email & password' })
    return
  }

  let usersDb = JSON.parse(localStorage.getItem('usersDb') || '[]')

  const exists = usersDb.find((u) => u.email === email.value)

  if (exists) {
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
  router.push('/home')
}

// EMAIL LOGIN
function handleEmailLogin() {
  let usersDb = JSON.parse(localStorage.getItem('usersDb') || '[]')

  const exists = usersDb.find((u) => u.email === email.value)

  if (!exists) {
    $q.notify({ type: 'negative', message: 'No account found' })
    return
  }

  if (exists.password) {
    const decrypted = decrypt(exists.password)

    if (decrypted !== password.value) {
      $q.notify({ type: 'negative', message: 'Incorrect password' })
      return
    }
  }

  $q.notify({ type: 'positive', message: 'Login successful!' })

  localStorage.setItem('user', encrypt({ email: email.value }))
  router.push('/home')
}

function logout() {
  // Remove encrypted logged-in user
  localStorage.removeItem('user')

  // Optional: also clear usersDb? (NO – don’t delete signup database)
  // localStorage.removeItem("usersDb")

  $q.notify({
    type: 'positive',
    message: 'Logged out successfully!',
  })

  // Redirect to login page
  router.push('/login')
}
</script>

<style scoped>
.bg-grey-2 {
  background-color: #f5f5f5;
}
</style>
