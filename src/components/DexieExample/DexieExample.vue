<template>
  <p v-if="!isIpfsReady">Loading IPFS...</p>
  <div v-if="isIpfsReady">
    <p v-if="isSyncDefined">Sync with {{ syncUrl }}</p>
    <button v-if="isSyncDefined" @click="doUndefineSync">undefine sync</button>
    <input type="text" v-if="!isSyncDefined" v-model="orbitdbUrlToOpen" />
    <button v-if="!isSyncDefined" @click="doDefineSync">
      Create repository (Empty string) or type OrbitDb address and connect
    </button>

    <FriendsList v-if="isSyncDefined" />
  </div>
</template>
<script lang="ts">
import FriendsList from "@/components/DexieExample/FriendsList.vue"; // @ is an alias to /src
import { defineComponent, ref, onMounted } from "vue";
import { db } from "./db";
import { SYNCABLE_PROTOCOL } from "./OrbitDexieSyncClient";

import { ipfsRepo } from "../OrbitDbWebExample/IpfsOrbitRepo";
import { ChangesStore } from "./ChangesStore";

export default defineComponent({
  props: {},
  components: { FriendsList },
  setup() {
    const isIpfsReady=ref(false)
    const isSyncDefined = ref(false);
    const syncUrl = ref("");
    const orbitdbUrlToOpen = ref("");

    const doOnMounted = async () => {
      const list = await db.syncable.list();
      if (list.length > 0) {
        isSyncDefined.value = true;
        syncUrl.value = list[0];
      }
      await ipfsRepo.doConnect();
      isIpfsReady.value=true
    };

    const doUndefineSync = async () => {
      const list = await db.syncable.list();
      for (let i = 0; i < list.length; i++) {
        await db.syncable.delete(list[i]);
      }

      isSyncDefined.value = false;
    };

    const doDefineSync = async () => {
      await doUndefineSync();

      const dbstore = new ChangesStore(ipfsRepo);
      if (orbitdbUrlToOpen.value) {
        await dbstore.openStore(orbitdbUrlToOpen.value);
      } else {
        await dbstore.createStore("changes", true);
      }

      await dbstore.loadStore();

      if (!dbstore.storeAddress) {
        return;
      }
      await db.syncable.connect(SYNCABLE_PROTOCOL, dbstore.storeAddress);

      isSyncDefined.value = true;
      syncUrl.value = dbstore.storeAddress;
    };

    onMounted(doOnMounted);

    return {
      isSyncDefined,
      doUndefineSync,
      doDefineSync,
      syncUrl,
      orbitdbUrlToOpen,
      isIpfsReady,
    };
  },
});
</script>
