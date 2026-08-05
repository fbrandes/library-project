import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import App from "./App.vue";
import { createUserStore } from "./state/userStore";
import { user, userId } from "./test/fixtures";

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("App", () => {
  it("renders current user details and status text", async () => {
    const store = createUserStore({
      createUser: vi.fn(async () => user()),
      getUser: vi.fn(async () => user()),
      updateUser: vi.fn(async () => user({ status: "INACTIVE" })),
      deleteUser: vi.fn(async () => undefined),
    });
    store.state.currentUser = user();
    store.state.lookupId = userId;
    store.state.message = "User loaded";

    const wrapper = mount(App, {
      props: { storeFactory: () => store },
    });

    expect(wrapper.text()).toContain("User Management");
    expect(wrapper.text()).toContain("ada@example.com");
    expect(wrapper.text()).toContain("User loaded");
  });

  it("wires form actions to the store", async () => {
    const store = createUserStore({
      createUser: vi.fn(async () => user()),
      getUser: vi.fn(async () => user()),
      updateUser: vi.fn(async () => user()),
      deleteUser: vi.fn(async () => undefined),
    });
    const createSpy = vi.spyOn(store, "create");
    const updateSpy = vi.spyOn(store, "update");
    const deleteSpy = vi.spyOn(store, "delete");
    const loadSpy = vi.spyOn(store, "load");

    const wrapper = mount(App, {
      props: { storeFactory: () => store },
    });

    const inputs = wrapper.findAll("input");
    await inputs.at(0).setValue("ada@example.com");
    await inputs.at(1).setValue("Ada");
    await inputs.at(2).setValue("Lovelace");
    await inputs.at(3).setValue(userId);

    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();
    await wrapper.findAll("button").at(1).trigger("click");
    await flushPromises();
    await wrapper.findAll("button").at(2).trigger("click");
    await flushPromises();
    store.setLookupId(userId);
    await wrapper.vm.$nextTick();
    await wrapper.findAll("button").at(3).trigger("click");
    await flushPromises();

    expect(store.state.draft.email).toBe("ada@example.com");
    expect(createSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalled();
    expect(deleteSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
  });

  it("renders errors with error class", () => {
    const store = createUserStore({
      createUser: vi.fn(async () => user()),
      getUser: vi.fn(async () => user()),
      updateUser: vi.fn(async () => user()),
      deleteUser: vi.fn(async () => undefined),
    });
    store.state.error = "Failed";

    const wrapper = mount(App, {
      props: { storeFactory: () => store },
    });

    expect(wrapper.find(".user-management-status-line").classes()).toContain(
      "user-management-error",
    );
    expect(wrapper.text()).toContain("Failed");
  });
});
