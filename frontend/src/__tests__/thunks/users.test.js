import { configureStore } from "@reduxjs/toolkit";
import usersReducer, { thunkGetAllUsers, thunkUpdateProfile } from "../../redux/users";

const mockFetch = (response, ok = true) =>
    jest.fn(() => Promise.resolve({ ok, json: () => Promise.resolve(response) }));

describe("users thunks", () => {
    afterEach(() => jest.restoreAllMocks());

    test("thunkGetAllUsers loads users", async () => {
        global.fetch = mockFetch({ success: true, data: { users: [{ id: 1, email: "a@b.com" }] } });
        const store = configureStore({ reducer: { users: usersReducer } });
        await store.dispatch(thunkGetAllUsers());
        expect(store.getState().users.data).toHaveLength(1);
    });

    test("thunkUpdateProfile updates current user", async () => {
        global.fetch = mockFetch({ success: true, data: { user: { id: 1, first_name: "Jane" } } });
        const store = configureStore({ reducer: { users: usersReducer } });
        await store.dispatch(thunkUpdateProfile({ first_name: "Jane" }));
        expect(store.getState().users.current?.first_name).toBe("Jane");
    });
});
