import { configureStore } from "@reduxjs/toolkit";
import propertiesReducer, { thunkGetAllProperties, thunkCreateProperty, thunkDeleteProperty } from "../../redux/properties";

const mockFetch = (response) =>
    jest.fn(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve(response),
        })
    );

describe("properties thunks", () => {
    beforeEach(() => {
        global.fetch = mockFetch({ success: true, data: { properties: [{ id: 1, name: "Test" }] } });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("thunkGetAllProperties loads properties into state", async () => {
        const store = configureStore({ reducer: { properties: propertiesReducer } });
        await store.dispatch(thunkGetAllProperties());
        const state = store.getState();
        expect(state.properties.data).toHaveLength(1);
        expect(state.properties.data[0].name).toBe("Test");
    });

    test("thunkCreateProperty adds to state", async () => {
        global.fetch = mockFetch({ success: true, data: { property: { id: 2, name: "New" } } });
        const store = configureStore({ reducer: { properties: propertiesReducer } });
        await store.dispatch(thunkCreateProperty({ name: "New", lat: 0, lng: 0 }));
        const state = store.getState();
        expect(state.properties.data).toHaveLength(1);
    });

    test("thunkDeleteProperty removes from state", async () => {
        global.fetch = mockFetch({ success: true });
        const store = configureStore({
            reducer: { properties: propertiesReducer },
            preloadedState: { properties: { data: [{ id: 1, name: "Test" }] } },
        });
        await store.dispatch(thunkDeleteProperty(1));
        const state = store.getState();
        expect(state.properties.data).toHaveLength(0);
    });
});
