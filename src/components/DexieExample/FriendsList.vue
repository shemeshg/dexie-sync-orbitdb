<template>
{{refreshText}}
  <p>Add friend</p>
  <FriendAdder
    @friend-add="friendAdd"
    :status="addStatus"
    ref="friendAddComponentRef"
  />
  <li v-for="item in frendslistAry" :key="item.oid">
    {{ item.name }} {{ item.age }} <button @click="delItem(item.oid)">Del</button>
  </li>
 
</template>
<script lang="ts">
import FriendAdder from "@/components/DexieExample/FriendAdder.vue"; // @ is an alias to /src
import { defineComponent, ref, onMounted, Ref } from "vue";
import { Friend, db } from "./db";

export default defineComponent({
  props: {
    refreshText: String
  },
  components: { FriendAdder },
  setup() {
    const addStatus = ref("");
    const friendAddComponentRef=ref();
    const frendslistAry: Ref<Friend[]>=ref([])
    const friendAdd = async (params: Friend) => {
      addStatus.value = "";

      try {
        // Add the new friend!
        const id = await db.friends.add({
          name: params.name,
          age: params.age,
        });

        addStatus.value = `Friend ${params.name}
          successfully added. Got id ${id}`;
       
        friendAddComponentRef.value.resetForm();
        frendslistAry.value = await db.friends.toArray() 
      } catch (error) {
        addStatus.value = `Failed to add
          ${params.name}: ${error}`;
      }
    };

    const doOnMounted = async ()=>{
      frendslistAry.value = []
      frendslistAry.value = await db.friends.toArray() 
    }
    
    const delItem=async (id: number)=>{
      await db.friends.delete(id) 
      frendslistAry.value = await db.friends.toArray() 
    }

    onMounted(doOnMounted)

    return {addStatus, friendAdd, friendAddComponentRef, frendslistAry, delItem, doOnMounted }
  },
});
</script>
