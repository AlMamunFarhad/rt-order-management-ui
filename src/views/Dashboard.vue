<template>
  <div>
    <h1>Dashboard</h1>
    <p>Welcome, {{ auth.user?.name }}</p>
    <button @click="auth.logout">Logout</button>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>
