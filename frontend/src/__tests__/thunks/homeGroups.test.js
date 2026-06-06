import { configureStore } from "@reduxjs/toolkit";
import homeGroupsReducer, { thunkGetGroups, thunkCreateGroup, thunkDeleteGroup } from "../../redux/homeGroups";

const mockFetch = (response) =>
    jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(response) }));

describe("homeGroups thunks", () => {
    afterEach(() => jest.restoreAllMocks());

    test("thunkGetGroups loads groups", async () => {
        global.fetch = mockFetch({ success: true, data: { groups: [{ id: 1, name: "G1" }] } });
        const store = configureStore({ reducer: { homeGroups: homeGroupsReducer } });
        await store.dispatch(thunkGetGroups());
        expect(store.getState().homeGroups.data).toHaveLength(1);
    });

    test("thunkCreateGroup adds group", async () => {
        global.fetch = mockFetch({ success: true, data: { group: { id: 2, name: "G2" } } });
        const store = configureStore({ reducer: { homeGroups: homeGroupsReducer } });
        await store.dispatch(thunkCreateGroup({ name: "G2", type: "location" }));
        expect(store.getState().homeGroups.data).toHaveLength(1);
    });

    test("thunkDeleteGroup removes group", async () => {
        global.fetch = mockFetch({ success: true });
        const store = configureStore({
            reducer: { homeGroups: homeGroupsReducer },
            preloadedState: { homeGroups: { data: [{ id: 1, name: "G1" }] } },
        });
        await store.dispatch(thunkDeleteGroup(1));
        expect(store.getState().homeGroups.data).toHaveLength(0);
    });
});
