<script lang="ts">
  import { onMount } from 'svelte';

  import '@material/web/button/filled-button.js';
  import '@material/web/button/outlined-button.js';
  import '@material/web/button/text-button.js';
  import '@material/web/icon/icon.js';
  import '@material/web/select/outlined-select.js';
  import '@material/web/select/select-option.js';
  import '@material/web/textfield/outlined-text-field.js';

  import { createBookFromInput } from './lib/bookFactory';
  import { getCurrentRentedBooks, getNextState, rentingStore, type RentingStore } from './stores/rentingStore';
  import { countBooks, orderStates, type Order, type OrderState } from './types/order';

  let state: RentingStore = rentingStore.getState();
  let isbn = '9780134685991';
  let title = 'Effective Go Services';
  let selectedState: OrderState = 'PLACED';

  onMount(() => {
    const unsubscribe = rentingStore.subscribe((next) => {
      state = next;
    });
    void state.loadOrders();
    return unsubscribe;
  });

  $: currentOrders = state.orders.filter((order) => order.userId === state.userId);
  $: rentedBooks = getCurrentRentedBooks(state.orders, state.userId);

  function updateUserId(event: Event): void {
    state.setUserId((event.currentTarget as HTMLInputElement).value);
  }

  function updateIsbn(event: Event): void {
    isbn = (event.currentTarget as HTMLInputElement).value;
  }

  function updateTitle(event: Event): void {
    title = (event.currentTarget as HTMLInputElement).value;
  }

  function updateSelectedState(event: Event): void {
    selectedState = (event.currentTarget as HTMLInputElement).value as OrderState;
  }

  function submitRental(): void {
    const book = createBookFromInput(isbn, title);
    void state.rentBooks({
      userId: state.userId,
      contents: [book],
      state: selectedState,
    });
  }

  function advanceOrder(order: Order): void {
    void state.updateOrder(order.id, {
      userId: order.userId,
      contents: order.contents,
      state: getNextState(order.state),
    });
  }
</script>

<main class="app-shell">
  <header class="topbar">
    <div>
      <p class="eyebrow">Library rental service</p>
      <h1>Renting</h1>
    </div>
    <md-outlined-text-field
      label="User ID"
      value={state.userId}
      oninput={updateUserId}
      class="user-field"
    ></md-outlined-text-field>
  </header>

  {#if state.error}
    <section class="status status-error" role="alert">{state.error}</section>
  {/if}

  <section class="workspace">
    <form
      class="rental-panel"
      onsubmit={(event) => {
        event.preventDefault();
        submitRental();
      }}
      aria-label="Create rental order"
    >
      <div class="panel-heading">
        <h2>New rental</h2>
        <span>{rentedBooks.length} active books</span>
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
      <md-filled-button type="submit" disabled={state.isLoading}>
        <md-icon slot="icon">add</md-icon>
        Rent book
      </md-filled-button>
    </form>

    <section class="orders-panel" aria-label="Rental orders">
      <div class="panel-heading">
        <h2>Orders</h2>
        <md-outlined-button type="button" disabled={state.isLoading} onclick={() => state.loadOrders()}>
          <md-icon slot="icon">refresh</md-icon>
          Refresh
        </md-outlined-button>
      </div>

      {#if state.isLoading}
        <div class="status">Loading orders</div>
      {:else if currentOrders.length === 0}
        <div class="empty">No rental orders for {state.userId}</div>
      {:else}
        <div class="order-list">
          {#each currentOrders as order (order.id)}
            <article class="order-row">
              <div>
                <div class="order-title">{order.contents.map((book) => book.title).join(', ')}</div>
                <div class="order-meta">
                  <span>{order.state}</span>
                  <span>{countBooks(order)} books</span>
                  <span>Due {new Date(order.rentEndsAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div class="order-actions">
                <md-text-button type="button" onclick={() => advanceOrder(order)}>
                  <md-icon slot="icon">sync_alt</md-icon>
                  Next
                </md-text-button>
                <md-outlined-button type="button" onclick={() => state.cancelOrder(order.id)}>
                  <md-icon slot="icon">cancel</md-icon>
                  Cancel
                </md-outlined-button>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  </section>
</main>
