<template>
  <div class="home">
    <DexieExample />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import DexieExample from '@/components/DexieExample/DexieExample.vue'; // @ is an alias to /src

export default defineComponent({
  components: {
    DexieExample,
  }
});
</script>
