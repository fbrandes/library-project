<template>
  <section class="user-management-panel" aria-labelledby="user-form-heading">
    <h2 id="user-form-heading">User</h2>
    <form class="user-management-form-grid" @submit.prevent="$emit('create')">
      <label class="user-management-field">
        <span>Email</span>
        <input
          :value="draft.email"
          autocomplete="email"
          type="email"
          @input="emitDraftChange('email', $event)"
        />
      </label>

      <label class="user-management-field">
        <span>First name</span>
        <input :value="draft.firstName" autocomplete="given-name" @input="emitDraftChange('firstName', $event)" />
      </label>

      <label class="user-management-field">
        <span>Last name</span>
        <input :value="draft.lastName" autocomplete="family-name" @input="emitDraftChange('lastName', $event)" />
      </label>

      <label class="user-management-field">
        <span>Role</span>
        <select :value="draft.role" @change="emitDraftChange('role', $event)">
          <option v-for="role in roleOptions" :key="role" :value="role">{{ role }}</option>
        </select>
      </label>

      <label class="user-management-field">
        <span>Status</span>
        <select :value="draft.status" @change="emitDraftChange('status', $event)">
          <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
        </select>
      </label>

      <div class="user-management-actions">
        <button class="user-management-button user-management-button-primary" type="submit" :disabled="loading">
          Create
        </button>
        <button
          class="user-management-button"
          type="button"
          :disabled="loading || !lookupId"
          @click="$emit('update')"
        >
          Update
        </button>
        <button
          class="user-management-button user-management-button-danger"
          type="button"
          :disabled="loading || !lookupId"
          @click="$emit('delete')"
        >
          Delete
        </button>
      </div>
    </form>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

import type { UserDraft } from '../state/userStore';
import type { UserRole, UserStatus } from '../generated/userModels';

type DraftField = keyof UserDraft;

export default defineComponent({
  name: 'UserForm',
  props: {
    draft: {
      type: Object as PropType<UserDraft>,
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
    roleOptions: {
      type: Array as PropType<UserRole[]>,
      required: true,
    },
    statusOptions: {
      type: Array as PropType<UserStatus[]>,
      required: true,
    },
  },
  emits: ['create', 'delete', 'draft-change', 'update'],
  setup(_props, { emit }) {
    function readValue(event: Event): string {
      return (event.currentTarget as HTMLInputElement | HTMLSelectElement).value;
    }

    function emitDraftChange(field: DraftField, event: Event): void {
      emit('draft-change', field, readValue(event));
    }

    return {
      emitDraftChange,
    };
  },
});
</script>
