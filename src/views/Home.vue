<template>
  <div class="home">
    <OrbitDbWebExample/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import OrbitDbWebExample from '@/components/OrbitDbWebExample/OrbitDbWebExample.vue'; // @ is an alias to /src

export default defineComponent({
  name: 'Home',
  components: {
    OrbitDbWebExample,
  },
});
</script>
<style lang="scss">

</style>