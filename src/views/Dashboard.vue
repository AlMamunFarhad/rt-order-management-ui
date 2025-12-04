<template>
  <div>
    <nav class="navbar navbar-light bg-light">
      <div class="container-fluid">
        <router-link class="navbar-brand" to="/products">Products</router-link>
        <router-link class="navbar-brand" to="/orders">Orders</router-link>
        <button @click="handleLogout" class="navbar-brand btn btn-light">Logout</button>
      </div>
    </nav>
    <div class="container">
      <h1>Dashboard</h1>
      <p>Welcome, {{ auth.user?.name }}</p>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();

const handleLogout = async () => {
  try {
    await auth.logout();
  } catch (e) {
    console.error("Logout failed:", e);
  } finally {
    window.location.href = "/login";
  }
};
</script>
