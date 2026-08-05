<template>
  <section class="user-management-panel" aria-labelledby="lookup-heading">
    <h2 id="lookup-heading">Lookup</h2>
    <div class="user-management-lookup">
      <label class="user-management-field">
        <span>User id</span>
        <input :value="lookupId" autocomplete="off" @input="emitLookupIdChange" />
      </label>
      <button
        class="user-management-button user-management-button-primary"
        :disabled="loading || !lookupId"
        type="button"
        @click="$emit('load')"
      >
        Load
      </button>
    </div>

    <p class="user-management-status-line" :class="{ 'user-management-error': error }">
      {{ error || message }}
    </p>

    <UserDetail :user="currentUser" />
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

import type { User } from '../generated/userModels';
import UserDetail from './UserDetail.vue';

export default defineComponent({
  name: 'UserLookup',
  components: {
    UserDetail,
  },
  props: {
    currentUser: {
      type: Object as PropType<User | null>,
      default: null,
    },
    error: {
      type: String,
      required: true,
    },
    loading: {
      type: Boolean,
      required: true,
    },
    lookupId: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  emits: ['load', 'lookup-id-change'],
  setup(_props, { emit }) {
    function emitLookupIdChange(event: Event): void {
      emit('lookup-id-change', (event.currentTarget as HTMLInputElement).value);
    }

    return {
      emitLookupIdChange,
    };
  },
});
</script>
