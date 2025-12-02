<template>
  <q-page padding>
    <!-- Page Title -->
    <div class="text-h5 text-primary q-mb-md">Buy Flashcards</div>

    <!-- Coins Wallet -->
    <q-card bordered class="q-pa-md q-mb-lg shadow-2">
      <div class="text-h6">Your Coin Balance</div>
      <div class="text-h4 text-green-7 text-bold">{{ coins }} Coins</div>
    </q-card>

    <!-- Flashcard Packs -->
    <div class="row q-col-gutter-md">
      <div v-for="pack in packs" :key="pack.id" class="col-12 col-sm-6">
        <q-card bordered class="shadow-2">
          <q-card-section>
            <div class="text-h6">{{ pack.title }}</div>
            <div class="text-body2 q-mt-xs">{{ pack.desc }}</div>
          </q-card-section>

          <q-card-section>
            <div class="text-primary text-body1 text-bold">Price: {{ pack.price }} Coins</div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn color="accent" label="Buy" @click="buyPack(pack)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// Example coin balance (use Pinia/Firebase in real case)
const coins = ref(150)

const packs = ref([
  { id: 1, title: 'Physics Class 12', desc: '150 curated flashcards', price: 60 },
  { id: 2, title: 'NEET Biology', desc: '300 high-yield flashcards', price: 90 },
  { id: 3, title: 'Python Basics', desc: '80 coding flashcards', price: 50 },
  { id: 4, title: 'English Vocabulary', desc: '200 common words', price: 70 },
])

const buyPack = (pack) => {
  if (coins.value < pack.price) {
    return $q.notify({
      type: 'warning',
      message: 'Not enough coins! Go to Subscription to buy more.',
    })
  }

  coins.value -= pack.price

  $q.notify({
    type: 'positive',
    message: `${pack.title} purchased successfully!`,
  })

  // TODO:
  // Add flashcard pack to user's library
}
</script>
