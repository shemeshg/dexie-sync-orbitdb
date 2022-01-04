<template>
  <div id="nav" v-if="ipfsLoaded">
    <router-link to="/">Home</router-link> |
    <router-link to="/DiexieExample">DiexieExample</router-link> |
    <router-link to="/about">About</router-link>
  </div>
  <div  v-if="!ipfsLoaded">
    Loading IPFS
  </div>
  <router-view v-if="ipfsLoaded" />
</template>
<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import { ipfsRepo } from "@/components/OrbitDbWebExample/IpfsOrbitRepo"

export default defineComponent({
  name: "Home",
  components: {},
  setup() {
    const ipfsLoaded=ref(false)
    const doOnMounted = async () => {
       await ipfsRepo.doConnect();
       ipfsLoaded.value=true
    };
    onMounted(doOnMounted);
    return {ipfsLoaded};
  },
});
</script>
<style lang="scss">
#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
