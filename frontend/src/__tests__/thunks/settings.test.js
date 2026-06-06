import { configureStore } from "@reduxjs/toolkit";
import settingsReducer, { thunkGetSettings, thunkUpdateSettings } from "../../redux/settings";

const mockFetch = (response, ok = true) =>
    jest.fn(() => Promise.resolve({ ok, json: () => Promise.resolve(response) }));

describe("settings thunks", () => {
    afterEach(() => jest.restoreAllMocks());

    test("thunkGetSettings stores settings", async () => {
        global.fetch = mockFetch({ success: true, data: { settings: { theme: "dark" } } });
        const store = configureStore({ reducer: { settings: settingsReducer } });
        await store.dispatch(thunkGetSettings());
        expect(store.getState().settings.theme).toBe("dark");
    });

    test("thunkUpdateSettings updates settings", async () => {
        global.fetch = mockFetch({ success: true, data: { settings: { theme: "light" } } });
        const store = configureStore({ reducer: { settings: settingsReducer } });
        await store.dispatch(thunkUpdateSettings({ theme: "light" }));
        expect(store.getState().settings.theme).toBe("light");
    });
});
