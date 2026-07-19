import { configureStore } from "@reduxjs/toolkit";
import roomsReducer, { thunkGetRooms, thunkCreateRoom, thunkDeleteRoom } from "../../redux/rooms";

const mockFetch = (response) =>
    vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(response) }));

describe("rooms thunks", () => {
    afterEach(() => vi.restoreAllMocks());

    test("thunkGetRooms loads rooms", async () => {
        global.fetch = mockFetch({ success: true, data: { rooms: [{ id: 1, name: "R1" }] } });
        const store = configureStore({ reducer: { rooms: roomsReducer } });
        await store.dispatch(thunkGetRooms(1));
        expect(store.getState().rooms.data).toHaveLength(1);
    });

    test("thunkCreateRoom adds room", async () => {
        global.fetch = mockFetch({ success: true, data: { room: { id: 2, name: "R2" } } });
        const store = configureStore({ reducer: { rooms: roomsReducer } });
        await store.dispatch(thunkCreateRoom({ floor_id: 1, type: "bedroom", name: "R2" }));
        expect(store.getState().rooms.data).toHaveLength(1);
    });

    test("thunkDeleteRoom removes room", async () => {
        global.fetch = mockFetch({ success: true });
        const store = configureStore({
            reducer: { rooms: roomsReducer },
            preloadedState: { rooms: { data: [{ id: 1, name: "R1" }] } },
        });
        await store.dispatch(thunkDeleteRoom(1));
        expect(store.getState().rooms.data).toHaveLength(0);
    });
});
