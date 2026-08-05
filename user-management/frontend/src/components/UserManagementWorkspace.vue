<template>
  <div class="user-management-shell" :class="{ 'user-management-shell-embedded': embedded }">
    <header class="user-management-topbar">
      <h1>User Management</h1>
    </header>

    <main class="user-management-workspace">
      <UserForm
        :draft="state.draft"
        :loading="state.loading"
        :lookup-id="state.lookupId"
        :role-options="roleOptions"
        :status-options="statusOptions"
        @create="actions.create"
        @delete="actions.delete"
        @draft-change="setDraft"
        @update="actions.update"
      />

      <UserLookup
        :current-user="state.currentUser"
        :error="state.error"
        :loading="state.loading"
        :lookup-id="state.lookupId"
        :message="state.message"
        @load="actions.load"
        @lookup-id-change="actions.setLookupId"
      />
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

import { createUserStore, roleOptions, statusOptions, type UserDraft, type UserStore } from '../state/userStore';
import UserForm from './UserForm.vue';
import UserLookup from './UserLookup.vue';

export default defineComponent({
  name: 'UserManagementWorkspace',
  components: {
    UserForm,
    UserLookup,
  },
  props: {
    embedded: {
      type: Boolean,
      default: false,
    },
    storeFactory: {
      type: Function as PropType<() => UserStore>,
      default: createUserStore,
    },
  },
  setup(props) {
    const store = props.storeFactory();
    return {
      state: store.state,
      actions: store,
      roleOptions,
      statusOptions,
      setDraft<K extends keyof UserDraft>(field: K, value: UserDraft[K]) {
        store.setDraftField(field, value);
      },
    };
  },
});
</script>
