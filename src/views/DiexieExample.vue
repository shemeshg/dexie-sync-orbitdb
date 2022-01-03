<template>
  <div class="home">
    <FriendsList />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FriendsList from '@/components/DexieExample/FriendsList.vue'; // @ is an alias to /src

export default defineComponent({
  components: {
    FriendsList,
  }
});
</script>
