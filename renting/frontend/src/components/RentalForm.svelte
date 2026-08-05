<script lang="ts">
  import type { OrderState } from '../types/order';
  import { orderStates } from '../types/order';

  export let activeBookCount = 0;
  export let isbn = '';
  export let isLoading = false;
  export let onIsbnChange: (isbn: string) => void;
  export let onSelectedStateChange: (state: OrderState) => void;
  export let onSubmit: () => void;
  export let onTitleChange: (title: string) => void;
  export let selectedState: OrderState = 'PLACED';
  export let title = '';

  function updateIsbn(event: Event): void {
    onIsbnChange((event.currentTarget as HTMLInputElement).value);
  }

  function updateTitle(event: Event): void {
    onTitleChange((event.currentTarget as HTMLInputElement).value);
  }

  function updateSelectedState(event: Event): void {
    onSelectedStateChange((event.currentTarget as HTMLInputElement).value as OrderState);
  }

  function submitRental(): void {
    onSubmit();
  }
</script>

<form
  class="renting-rental-panel"
  onsubmit={(event) => {
    event.preventDefault();
    submitRental();
  }}
  aria-label="Create rental order"
>
  <div class="renting-panel-heading">
    <h2>New rental</h2>
    <span>{activeBookCount} active books</span>
  </div>
  <md-outlined-text-field label="ISBN" value={isbn} required oninput={updateIsbn}></md-outlined-text-field>
  <md-outlined-text-field label="Title" value={title} required oninput={updateTitle}></md-outlined-text-field>
  <md-outlined-select label="Initial state" value={selectedState} onchange={updateSelectedState}>
    {#each orderStates as option}
      <md-select-option value={option}>
        <div slot="headline">{option}</div>
      </md-select-option>
    {/each}
  </md-outlined-select>
  <md-filled-button type="submit" disabled={isLoading}>
    <md-icon slot="icon">add</md-icon>
    Rent book
  </md-filled-button>
</form>
