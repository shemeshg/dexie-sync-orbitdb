<template>
  <p v-if="isSyncDefined">Sync with {{syncUrl}} </p>
  <button v-if="isSyncDefined" @click="doUndefineSync">undefine sync</button>
  <input type="text" v-if="!isSyncDefined"/>
  <button v-if="!isSyncDefined" @click="doDefineSync">
    Create repository (Empty string) or type OrbitDb address and connect
  </button>

  <FriendsList v-if="isSyncDefined" />
</template>
<script lang="ts">
import FriendsList from "@/components/DexieExample/FriendsList.vue"; // @ is an alias to /src
import { defineComponent, ref, onMounted } from "vue";
import {db} from "./db"
import {SYNCABLE_PROTOCOL} from "./OrbitDexieSyncClient"

export default defineComponent({
  props: {},
  components: { FriendsList },
  setup() {
    const isSyncDefined = ref(false);
    const syncUrl = ref("")

    const doOnMounted = async () => {
      const list = await db.syncable.list()      
      if (list.length > 0){
        isSyncDefined.value = true;
        syncUrl.value = list[0]
      }

    };

    const doUndefineSync = async() => {
      const list = await db.syncable.list()  
      await db.syncable.delete(list[0])
      isSyncDefined.value = false;
    };

    const doDefineSync = async() => {
      
      await db.syncable.connect(SYNCABLE_PROTOCOL,"http://google.com")
      isSyncDefined.value = true;
      syncUrl.value = "http://google.com"
    };

    onMounted(doOnMounted);

    return { isSyncDefined, doUndefineSync, doDefineSync, syncUrl };
  },
});
</script>
