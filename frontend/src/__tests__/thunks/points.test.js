import { configureStore } from "@reduxjs/toolkit";
import pointsReducer, { thunkGetPoints, thunkCreatePoint, thunkDeletePoint } from "../../redux/points";

const mockFetch = (response) =>
    vi.fn(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve(response),
        })
    );

describe("points thunks", () => {
    beforeEach(() => {
        global.fetch = mockFetch({ success: true, data: { points: [{ id: 1, name: "P1", type: "icon" }] } });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("thunkGetPoints loads points into state", async () => {
        const store = configureStore({ reducer: { points: pointsReducer } });
        await store.dispatch(thunkGetPoints());
        const state = store.getState();
        expect(state.points.data).toHaveLength(1);
    });

    test("thunkCreatePoint adds to state", async () => {
        global.fetch = mockFetch({ success: true, data: { point: { id: 2, name: "P2", type: "icon" } } });
        const store = configureStore({ reducer: { points: pointsReducer } });
        await store.dispatch(thunkCreatePoint({ type: "icon", name: "P2", lng: 0, lat: 0 }));
        expect(store.getState().points.data).toHaveLength(1);
    });

    test("thunkDeletePoint removes from state", async () => {
        global.fetch = mockFetch({ success: true });
        const store = configureStore({
            reducer: { points: pointsReducer },
            preloadedState: { points: { data: [{ id: 1, name: "P1", type: "icon" }] } },
        });
        await store.dispatch(thunkDeletePoint(1));
        expect(store.getState().points.data).toHaveLength(0);
    });
});
