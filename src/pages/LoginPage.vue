<template>
  <q-page class="row justify-center items-center q-pa-md bg-grey-2">
    <q-card class="q-pa-lg shadow-4" style="width: 400px; max-width: 95%">
      <div class="text-h5 text-center q-mb-md">🔐 Login</div>

      <q-form class="q-gutter-md">
        <q-input
          filled
          v-model="loginUsername"
          label="Username"
          prepend-icon="person"
          @input="filterUsers"
        >
          <template #hint>
            <div v-if="filteredUsers.length">
              <div v-for="(u, i) in filteredUsers" :key="i" class="text-grey-7">• {{ u }}</div>
            </div>
          </template>
        </q-input>

        <q-input
          filled
          v-model="loginPassword"
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

        <q-btn label="Login" color="primary" class="full-width" @click="handleEmailLogin" />
      </q-form>

      <q-btn
        label="New here? Create Account"
        color="secondary"
        class="full-width q-mt-md"
        @click="showSignup = true"
      />

      <div class="text-center q-mt-md text-grey">───── Or Continue With ─────</div>

      <!-- GOOGLE LOGIN -->
      <q-btn
        color="white"
        text-color="black"
        class="full-width q-mt-md"
        unelevated
        @click="handleGoogleSignup"
      >
        <img
          src="https://developers.google.com/identity/images/g-logo.png"
          style="width: 20px; margin-right: 10px"
        />
        Sign up / Login with Google
      </q-btn>

      <!-- FINGERPRINT LOGIN -->
      <q-btn
        color="primary"
        icon="fingerprint"
        label="Login with Fingerprint"
        class="full-width q-mt-sm"
        @click="handleBiometricLogin"
      />
    </q-card>

    <!-- SIGNUP DIALOG -->
    <q-dialog v-model="showSignup" persistent>
      <q-card class="q-pa-md" style="width: 400px; max-width: 95%">
        <div class="text-h6 text-center q-mb-sm">Create Account</div>

        <q-form class="q-gutter-sm">
          <q-input filled v-model="firstName" label="First Name" />
          <q-input filled v-model="lastName" label="Last Name" />
          <q-input filled v-model="signupUsername" label="Username" />
          <q-input filled v-model="signupEmail" label="Email" type="email" />

          <q-input
            filled
            v-model="signupPassword"
            label="Password"
            :type="showPassword2 ? 'text' : 'password'"
          >
            <template #append>
              <q-icon
                :name="showPassword2 ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                @click="showPassword2 = !showPassword2"
              />
            </template>
          </q-input>

          <q-btn label="Signup" color="primary" class="full-width q-mt-md" @click="handleSignup" />

          <q-btn
            flat
            label="Cancel"
            color="negative"
            class="full-width q-mt-sm"
            @click="showSignup = false"
          />
        </q-form>
      </q-card>
    </q-dialog>
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

// AES SECRET
const SECRET_KEY = 'SUPER_SECRET_KEY_12345'

// STATE
const loginUsername = ref('')
const loginPassword = ref('')
const showPassword = ref(false)

const firstName = ref('')
const lastName = ref('')
const signupUsername = ref('')
const signupEmail = ref('')
const signupPassword = ref('')
const showPassword2 = ref(false)

const showSignup = ref(false)

// USER SUGGESTIONS
const allUsers = ref([])
const filteredUsers = ref([])

onMounted(() => {
  autoLoadSavedCredentials()
  autoLogin() // your existing fingerprint auto-login
})

// AES FUNCTIONS
function autoLoadSavedCredentials() {
  const saved = localStorage.getItem('user')
  if (!saved) return

  const decrypted = decrypt(saved)
  if (!decrypted?.username) return

  loginUsername.value = decrypted.username

  // Try to load the stored password from usersDb
  let db = JSON.parse(localStorage.getItem('usersDb') || '[]')
  const user = db.find((u) => u.username === decrypted.username)

  if (user?.password) {
    loginPassword.value = decrypt(user.password)
  }
}

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

// LOAD ALL USERS FOR SUGGESTIONS
onMounted(() => {
  let db = JSON.parse(localStorage.getItem('usersDb') || '[]')
  allUsers.value = db.map((u) => u.username)
  filteredUsers.value = [...allUsers.value]

  autoLogin()
})

// FILTER DROPDOWN SUGGESTIONS
function filterUsers(val, update) {
  update(() => {
    const needle = val.toLowerCase()
    filteredUsers.value = allUsers.value.filter((u) => u.toLowerCase().includes(needle))
  })
}

// AUTO FILL PASSWORD WHEN USER SELECTS USERNAME
function autoFillPassword(username) {
  let db = JSON.parse(localStorage.getItem('usersDb') || '[]')
  const user = db.find((u) => u.username === username)

  if (user && user.password) {
    loginPassword.value = decrypt(user.password)
  }
}

// ------------------------------
// AUTO LOGIN
// ------------------------------
function autoLogin() {
  const saved = localStorage.getItem('user')
  const finger = localStorage.getItem('fingerEnabled') === 'true'

  if (saved && finger) {
    handleBiometricAutoLogin()
    return
  }

  if (saved) {
    const data = decrypt(saved)
    if (data?.username) {
      loginUsername.value = data.username
      autoFillPassword(data.username)
    }
  }
}

function handleSignup() {
  if (
    !firstName.value ||
    !lastName.value ||
    !signupUsername.value ||
    !signupEmail.value ||
    !signupPassword.value
  ) {
    return $q.notify({ type: 'negative', message: 'Fill all fields' })
  }

  let db = JSON.parse(localStorage.getItem('usersDb') || '[]')

  if (db.find((u) => u.username === signupUsername.value)) {
    return $q.notify({ type: 'negative', message: 'Username already exists' })
  }

  db.push({
    firstName: firstName.value,
    lastName: lastName.value,
    username: signupUsername.value,
    email: signupEmail.value,
    password: encrypt(signupPassword.value),
  })

  localStorage.setItem('usersDb', JSON.stringify(db))
  allUsers.value.push(signupUsername.value)

  // save login
  localStorage.setItem(
    'user',
    encrypt({
      username: signupUsername.value,
      password: signupPassword.value,
    }),
  )

  localStorage.setItem('fingerEnabled', 'true')

  $q.notify({ type: 'positive', message: 'Signup successful!' })
  showSignup.value = false
  router.push('/home')
}

// ------------------------------
// LOGIN
// ------------------------------
function handleEmailLogin() {
  let db = JSON.parse(localStorage.getItem('usersDb') || '[]')
  const user = db.find((u) => u.username === loginUsername.value)

  if (!user) {
    return $q.notify({ type: 'negative', message: 'User not found' })
  }

  const realPass = decrypt(user.password)
  if (realPass !== loginPassword.value) {
    return $q.notify({ type: 'negative', message: 'Wrong password' })
  }

  // save active user
  localStorage.setItem(
    'user',
    encrypt({
      username: loginUsername.value,
      password: loginPassword.value,
    }),
  )

  $q.notify({ type: 'positive', message: 'Login successful!' })
  router.push('/home')
}

// ------------------------------
// BIOMETRIC LOGIN
// ------------------------------
async function handleBiometricLogin() {
  const saved = localStorage.getItem('user')
  if (!saved) return $q.notify({ type: 'negative', message: 'Login once first' })

  try {
    Fingerprint.isAvailable()
      .then(() => {
        // SECOND: Show fingerprint prompt
        return Fingerprint.show({
          title: 'Fingerprint Required',
          subtitle: 'Confirm your identity',
          description: 'Scan your fingerprint to continue',
          disableBackup: true,
        })
      })
      .then(() => {
        let db = JSON.parse(localStorage.getItem('usersDb') || '[]')
        const found = db.find((u) => u.username === loginUsername.value)

        localStorage.setItem(
          'user',
          encrypt({
            username: loginUsername.value,
            password: decrypt(found.password),
          }),
        )

        localStorage.setItem('fingerEnabled', 'true')

        $q.notify({ type: 'positive', message: 'Login successful!' })
        router.push('/home')
      })
      .catch(() => {
        // Fingerprint failed —> DO NOT LOGIN
        $q.notify({
          type: 'negative',
          message: 'Fingerprint authentication failed',
        })
      })
  } catch (e) {
    console.log('e', e)

    // Fingerprint failed → Do NOT login
    $q.notify({ type: 'negative', message: 'Fingerprint authentication failed' })
  }
}

async function handleBiometricAutoLogin() {
  const saved = localStorage.getItem('user')
  if (!saved) return

  try {
    await Fingerprint.isAvailable()

    const result = await Fingerprint.show({
      title: 'Welcome Back!',
      subtitle: 'Fingerprint Required',
      description: 'Authenticate to continue',
      disableBackup: true,
    })

    // If we reach here → Fingerprint SUCCESS
    if (result) {
      router.push('/home')
      return
    }
  } catch (err) {
    // HANDLE CANCEL
    if (err && err.message && err.message.toLowerCase().includes('cancel')) {
      // User cancelled → stay on login
      $q.notify({
        type: 'warning',
        message: 'Fingerprint cancelled',
      })
      return
    }
    $q.notify({
      type: 'negative',
      message: 'Fingerprint authentication failed',
    })
  }
}
</script>
<style scoped>
.bg-grey-2 {
  background-color: #f5f5f5;
}
</style>
