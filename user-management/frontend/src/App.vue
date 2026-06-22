<template>
  <div class="app-shell">
    <header class="topbar">
      <h1>User Management</h1>
    </header>

    <main class="workspace">
      <section class="panel" aria-labelledby="user-form-heading">
        <h2 id="user-form-heading">User</h2>
        <form class="form-grid" @submit.prevent="actions.create">
          <md-field>
            <label>Email</label>
            <md-input :value="state.draft.email" type="email" @input="setDraft('email', $event)" />
          </md-field>

          <md-field>
            <label>First name</label>
            <md-input :value="state.draft.firstName" @input="setDraft('firstName', $event)" />
          </md-field>

          <md-field>
            <label>Last name</label>
            <md-input :value="state.draft.lastName" @input="setDraft('lastName', $event)" />
          </md-field>

          <md-field>
            <label>Role</label>
            <md-select :value="state.draft.role" @input="setDraft('role', $event)">
              <md-option v-for="role in roleOptions" :key="role" :value="role">{{ role }}</md-option>
            </md-select>
          </md-field>

          <md-field>
            <label>Status</label>
            <md-select :value="state.draft.status" @input="setDraft('status', $event)">
              <md-option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</md-option>
            </md-select>
          </md-field>

          <div class="actions">
            <md-button class="md-raised md-primary" type="submit" :disabled="state.loading">Create</md-button>
            <md-button class="md-raised" type="button" :disabled="state.loading || !state.lookupId" @click="actions.update">
              Update
            </md-button>
            <md-button class="md-raised md-accent" type="button" :disabled="state.loading || !state.lookupId" @click="actions.delete">
              Delete
            </md-button>
          </div>
        </form>
      </section>

      <section class="panel" aria-labelledby="lookup-heading">
        <h2 id="lookup-heading">Lookup</h2>
        <div class="lookup">
          <md-field>
            <label>User id</label>
            <md-input :value="state.lookupId" @input="actions.setLookupId" />
          </md-field>
          <md-button class="md-raised md-primary" :disabled="state.loading || !state.lookupId" @click="actions.load">
            Load
          </md-button>
        </div>

        <p class="status-line" :class="{ error: state.error }">{{ state.error || state.message }}</p>

        <dl v-if="state.currentUser" class="user-detail">
          <div>
            <dt>ID</dt>
            <dd>{{ state.currentUser.id }}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{{ state.currentUser.email }}</dd>
          </div>
          <div>
            <dt>Name</dt>
            <dd>{{ state.currentUser.firstName }} {{ state.currentUser.lastName }}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{{ state.currentUser.role }}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{{ state.currentUser.status }}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{{ state.currentUser.updatedAt }}</dd>
          </div>
        </dl>
      </section>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { createUserStore, roleOptions, statusOptions, type UserDraft, type UserStore } from './state/userStore';

export default defineComponent({
  name: 'App',
  props: {
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
