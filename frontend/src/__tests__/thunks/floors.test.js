import { configureStore } from "@reduxjs/toolkit";
import floorsReducer, { thunkGetFloors, thunkCreateFloor, thunkDeleteFloor } from "../../redux/floors";

const mockFetch = (response) =>
    jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(response) }));

describe("floors thunks", () => {
    afterEach(() => jest.restoreAllMocks());

    test("thunkGetFloors loads floors", async () => {
        global.fetch = mockFetch({ success: true, data: { floors: [{ id: 1, name: "F1" }] } });
        const store = configureStore({ reducer: { floors: floorsReducer } });
        await store.dispatch(thunkGetFloors(1));
        expect(store.getState().floors.data).toHaveLength(1);
    });

    test("thunkCreateFloor adds floor", async () => {
        global.fetch = mockFetch({ success: true, data: { floor: { id: 2, name: "F2" } } });
        const store = configureStore({ reducer: { floors: floorsReducer } });
        await store.dispatch(thunkCreateFloor({ property_id: 1, name: "F2" }));
        expect(store.getState().floors.data).toHaveLength(1);
    });

    test("thunkDeleteFloor removes floor", async () => {
        global.fetch = mockFetch({ success: true });
        const store = configureStore({
            reducer: { floors: floorsReducer },
            preloadedState: { floors: { data: [{ id: 1, name: "F1" }] } },
        });
        await store.dispatch(thunkDeleteFloor(1));
        expect(store.getState().floors.data).toHaveLength(0);
    });
});
