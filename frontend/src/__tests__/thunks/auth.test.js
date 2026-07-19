import { configureStore } from "@reduxjs/toolkit";
import sessionReducer, { thunkLogin, thunkSignup, thunkLogout } from "../../redux/session";

const mockFetch = (response, ok = true) =>
    vi.fn(() =>
        Promise.resolve({
            ok,
            json: () => Promise.resolve(response),
        })
    );

describe("session thunks", () => {
    beforeEach(() => {
        global.fetch = mockFetch({ success: true, data: { db_user: { id: 1, email: "test@test.com" } } });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("thunkLogin dispatches setUser on success", async () => {
        const store = configureStore({ reducer: { session: sessionReducer } });
        await store.dispatch(thunkLogin({ email: "test@test.com", password: "pass" }));
        const state = store.getState();
        expect(state.session.user).toEqual({ id: 1, email: "test@test.com" });
    });

    test("thunkSignup returns data without crashing", async () => {
        const store = configureStore({ reducer: { session: sessionReducer } });
        const result = await store.dispatch(thunkSignup({ email: "test@test.com", password: "pass" }));
        expect(result.success).toBe(true);
    });

    test("thunkLogout dispatches removeUser", async () => {
        const store = configureStore({
            reducer: { session: sessionReducer },
            preloadedState: { session: { user: { id: 1, email: "test@test.com" } } },
        });
        await store.dispatch(thunkLogout());
        const state = store.getState();
        expect(state.session.user).toBeNull();
    });
});
