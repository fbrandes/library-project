<template>
  <UserManagementWorkspace :store-factory="storeFactory" />
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import UserManagementWorkspace from "./components/UserManagementWorkspace.vue";
import { createUserStore, type UserStore } from "./state/userStore";

export default defineComponent({
  name: "App",
  components: {
    UserManagementWorkspace,
  },
  props: {
    storeFactory: {
      type: Function as PropType<() => UserStore>,
      default: createUserStore,
    },
  },
});
</script>
