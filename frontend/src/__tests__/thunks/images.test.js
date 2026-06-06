import { configureStore } from "@reduxjs/toolkit";
import imagesReducer, { thunkGetImageById, thunkDeleteImage } from "../../redux/images";

const mockFetch = (response) =>
    jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(response) }));

describe("images thunks", () => {
    afterEach(() => jest.restoreAllMocks());

    test("thunkGetImageById stores image", async () => {
        global.fetch = mockFetch({ success: true, data: { id: 1, filename: "test.png" } });
        const store = configureStore({ reducer: { images: imagesReducer } });
        await store.dispatch(thunkGetImageById(1));
        expect(store.getState().images.data).toHaveLength(1);
    });

    test("thunkDeleteImage removes image", async () => {
        global.fetch = mockFetch({ success: true });
        const store = configureStore({
            reducer: { images: imagesReducer },
            preloadedState: { images: { data: [{ id: 1, filename: "test.png" }] } },
        });
        await store.dispatch(thunkDeleteImage(1));
        expect(store.getState().images.data).toHaveLength(0);
    });
});
