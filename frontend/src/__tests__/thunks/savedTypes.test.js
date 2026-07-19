import { configureStore } from "@reduxjs/toolkit";
import savedTypesReducer, { thunkGetSavedTypes, thunkCreateSavedType, thunkDeleteSavedType } from "../../redux/savedTypes";

const mockFetch = (response) =>
    vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(response) }));

describe("savedTypes thunks", () => {
    afterEach(() => vi.restoreAllMocks());

    test("thunkGetSavedTypes loads types", async () => {
        global.fetch = mockFetch({ success: true, data: { types: [{ id: 1, name: "Pizza", type: "🍕" }] } });
        const store = configureStore({ reducer: { savedTypes: savedTypesReducer } });
        await store.dispatch(thunkGetSavedTypes());
        expect(store.getState().savedTypes.data).toHaveLength(1);
    });

    test("thunkCreateSavedType adds type", async () => {
        global.fetch = mockFetch({ success: true, data: { type: { id: 2, name: "Burger" } } });
        const store = configureStore({ reducer: { savedTypes: savedTypesReducer } });
        await store.dispatch(thunkCreateSavedType({ name: "Burger", type: "🍔" }));
        expect(store.getState().savedTypes.data).toHaveLength(1);
    });

    test("thunkDeleteSavedType removes type", async () => {
        global.fetch = mockFetch({ success: true });
        const store = configureStore({
            reducer: { savedTypes: savedTypesReducer },
            preloadedState: { savedTypes: { data: [{ id: 1, name: "Pizza" }] } },
        });
        await store.dispatch(thunkDeleteSavedType(1));
        expect(store.getState().savedTypes.data).toHaveLength(0);
    });
});
