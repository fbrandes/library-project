<template>
  <dl v-if="user" class="user-management-detail">
    <div>
      <dt>ID</dt>
      <dd>{{ user.id }}</dd>
    </div>
    <div>
      <dt>Email</dt>
      <dd>{{ user.email }}</dd>
    </div>
    <div>
      <dt>Name</dt>
      <dd>{{ user.firstName }} {{ user.lastName }}</dd>
    </div>
    <div>
      <dt>Role</dt>
      <dd>{{ user.role }}</dd>
    </div>
    <div>
      <dt>Status</dt>
      <dd>{{ user.status }}</dd>
    </div>
    <div>
      <dt>Updated</dt>
      <dd>{{ user.updatedAt }}</dd>
    </div>
  </dl>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

import type { User } from '../generated/userModels';

export default defineComponent({
  name: 'UserDetail',
  props: {
    user: {
      type: Object as PropType<User | null>,
      default: null,
    },
  },
});
</script>
