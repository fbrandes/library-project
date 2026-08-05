<script lang="ts">
  import { onMount } from 'svelte';

  import '@material/web/button/filled-button.js';
  import '@material/web/button/outlined-button.js';
  import '@material/web/button/text-button.js';
  import '@material/web/icon/icon.js';
  import '@material/web/select/outlined-select.js';
  import '@material/web/select/select-option.js';
  import '@material/web/textfield/outlined-text-field.js';

  import { createBookFromInput } from '../lib/bookFactory';
  import { getCurrentRentedBooks, getNextState, rentingStore, type RentingStore } from '../stores/rentingStore';
  import type { Order, OrderState } from '../types/order';
  import OrderList from './OrderList.svelte';
  import RentalForm from './RentalForm.svelte';
  import RentingHeader from './RentingHeader.svelte';

  export let embedded = false;

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

<main class="renting-shell" class:renting-shell-embedded={embedded}>
  <RentingHeader userId={state.userId} onUserIdChange={state.setUserId} />

  {#if state.error}
    <section class="renting-status renting-status-error" role="alert">{state.error}</section>
  {/if}

  <section class="renting-workspace">
    <RentalForm
      activeBookCount={rentedBooks.length}
      bind:isbn
      isLoading={state.isLoading}
      onSelectedStateChange={(nextState) => {
        selectedState = nextState;
      }}
      onSubmit={submitRental}
      onTitleChange={(nextTitle) => {
        title = nextTitle;
      }}
      selectedState={selectedState}
      bind:title
      onIsbnChange={(nextIsbn) => {
        isbn = nextIsbn;
      }}
    />

    <OrderList
      isLoading={state.isLoading}
      onAdvanceOrder={advanceOrder}
      onCancelOrder={state.cancelOrder}
      onRefresh={state.loadOrders}
      orders={currentOrders}
      userId={state.userId}
    />
  </section>
</main>
