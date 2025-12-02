<template>
  <q-page padding>
    <div class="text-h5 text-primary q-mb-md">Subscription Plans</div>

    <q-card bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6 text-bold">Premium Monthly</div>
        <div class="text-subtitle2 q-mt-xs">Unlimited Flashcards • Cloud Backup</div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn color="primary" label="Buy ₹99" @click="buyPlan('monthly')" />
      </q-card-actions>
    </q-card>

    <q-card bordered>
      <q-card-section>
        <div class="text-h6 text-bold">Premium Yearly</div>
        <div class="text-subtitle2 q-mt-xs">Save 60% • Unlimited Everything</div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn color="accent" label="Buy ₹399" @click="buyPlan('yearly')" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
const buyPlan = (plan) => {
  // Integrate Razorpay / Stripe / In-app Purchase here
  console.log('Plan selected:', plan)
}
</script>
