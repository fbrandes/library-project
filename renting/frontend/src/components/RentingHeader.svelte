<script lang="ts">
  export let userId = '';
  export let onUserIdChange: (userId: string) => void;

  function updateUserId(event: Event): void {
    onUserIdChange((event.currentTarget as HTMLInputElement).value);
  }
</script>

<header class="renting-topbar">
  <div>
    <p class="renting-eyebrow">Library rental service</p>
    <h1>Renting</h1>
  </div>
  <md-outlined-text-field
    label="User ID"
    value={userId}
    oninput={updateUserId}
    class="renting-user-field"
  ></md-outlined-text-field>
</header>
