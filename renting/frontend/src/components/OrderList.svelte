<script lang="ts">
  import { countBooks, type Order } from '../types/order';

  export let isLoading = false;
  export let onAdvanceOrder: (order: Order) => void;
  export let onCancelOrder: (id: string) => void;
  export let onRefresh: () => void;
  export let orders: Order[] = [];
  export let userId = '';

  function runOnKeyboard(event: KeyboardEvent, action: () => void): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    action();
  }
</script>

<section class="renting-orders-panel" aria-label="Rental orders">
  <div class="renting-panel-heading">
    <h2>Orders</h2>
    <md-outlined-button
      type="button"
      disabled={isLoading}
      role="button"
      tabindex="0"
      onclick={onRefresh}
      onkeydown={(event: KeyboardEvent) => runOnKeyboard(event, onRefresh)}
    >
      <md-icon slot="icon">refresh</md-icon>
      Refresh
    </md-outlined-button>
  </div>

  {#if isLoading}
    <div class="renting-status">Loading orders</div>
  {:else if orders.length === 0}
    <div class="renting-empty">No rental orders for {userId}</div>
  {:else}
    <div class="renting-order-list">
      {#each orders as order (order.id)}
        <article class="renting-order-row">
          <div>
            <div class="renting-order-title">{order.contents.map((book) => book.title).join(', ')}</div>
            <div class="renting-order-meta">
              <span>{order.state}</span>
              <span>{countBooks(order)} books</span>
              <span>Due {new Date(order.rentEndsAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div class="renting-order-actions">
            <md-text-button
              type="button"
              role="button"
              tabindex="0"
              onclick={() => onAdvanceOrder(order)}
              onkeydown={(event: KeyboardEvent) => runOnKeyboard(event, () => onAdvanceOrder(order))}
            >
              <md-icon slot="icon">sync_alt</md-icon>
              Next
            </md-text-button>
            <md-outlined-button
              type="button"
              role="button"
              tabindex="0"
              onclick={() => onCancelOrder(order.id)}
              onkeydown={(event: KeyboardEvent) => runOnKeyboard(event, () => onCancelOrder(order.id))}
            >
              <md-icon slot="icon">cancel</md-icon>
              Cancel
            </md-outlined-button>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>
