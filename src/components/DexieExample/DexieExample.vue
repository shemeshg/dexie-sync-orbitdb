<template>
  <p v-if="!isIpfsReady">Loading IPFS...</p>
  <div v-if="isIpfsReady">
    <p v-if="isSyncDefined">Sync with {{ syncUrl }}</p>
    <button v-if="isSyncDefined" @click="doUndefineSync">undefine sync</button>
    <input type="text" v-if="!isSyncDefined" v-model="orbitdbUrlToOpen" />
    <button v-if="!isSyncDefined" @click="doDefineSync">
      Create repository (Empty string) or type OrbitDb address and connect
    </button>
    <div v-if="isSyncDefined">
      <p>
        Since every node rollup its own changes, no consistency among nodes guaranteed <br/>
        Send replica to all, to set current replica as source of truth,  <br/>
        and other nodes will re-rollup on top of that    <br/>
      </p>
      <p>
        <button @click="sendReplicaToall">Send replica to all</button>
      </p>
    </div>

    <FriendsList v-if="isSyncDefined" />
  </div>
</template>
<script lang="ts">
import FriendsList from "@/components/DexieExample/FriendsList.vue"; // @ is an alias to /src
import { defineComponent, ref, onMounted } from "vue";
import { db } from "./db";
import { SYNCABLE_PROTOCOL } from "./OrbitDexieSyncClient";

import { getChangesStore } from "./ChangesStore";

export default defineComponent({
  props: {},
  components: { FriendsList },
  setup() {
    const isIpfsReady = ref(false);
    const isSyncDefined = ref(false);
    const syncUrl = ref("");
    const orbitdbUrlToOpen = ref("");
    

    const doOnMounted = async () => {
      const list = await db.syncable.list();
      if (list.length > 0) {
        isSyncDefined.value = true;
        syncUrl.value = list[0];

        await db.syncable.connect(SYNCABLE_PROTOCOL, syncUrl.value);
        await getChangesStore(syncUrl.value);
       
      }

      isIpfsReady.value = true;
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
      
      const changesStore = await getChangesStore(syncUrl.value);

      if (!changesStore.storeAddress) {
        return;
      }
      await db.syncable.connect(SYNCABLE_PROTOCOL, changesStore.storeAddress);

      isSyncDefined.value = true;
      syncUrl.value = changesStore.storeAddress;
    };

    const sendReplicaToall=async ()=>{
      const changesStore = await getChangesStore(syncUrl.value);      
      changesStore.requestSendReplicaToAll = true      
    }
    onMounted(doOnMounted);

    return {
      isSyncDefined,
      doUndefineSync,
      doDefineSync,
      syncUrl,
      orbitdbUrlToOpen,
      isIpfsReady,
      sendReplicaToall,
    };
  },
});
</script>
