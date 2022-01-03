<!-- FriendAdder.vue -->
<template>
  <fieldset>
    <legend>Add new friend</legend>
    <label>
      Name:
      <input v-model="friendName" type="text" />
    </label>
    <br />
    <label>
      Age:
      <input v-model="friendAge" type="number" />
    </label>
    <br />
    <button @click="addFriend">Add Friend</button>
    <p>{{ status }}</p>
  </fieldset>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
export default defineComponent({
  props: {
    status: String,
  },
  components: {},
  emits: ["friend-add"],
  setup(props, { emit }) {
    const friendName = ref("");
    const friendAge = ref(21);
    const addFriend = () => {
      emit("friend-add", {
        name: friendName.value,
        age: friendAge.value,
      });
    };

    const resetForm = () => {
      friendName.value = "";
      friendAge.value = 21;
    };
    return {friendName, friendAge, addFriend, resetForm};
  },
});
</script>