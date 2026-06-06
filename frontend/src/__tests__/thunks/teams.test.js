import { configureStore } from "@reduxjs/toolkit";
import teamsReducer, { thunkCreateTeam } from "../../redux/teams";

const mockFetch = (response) =>
    jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(response) }));

describe("teams thunks", () => {
    afterEach(() => jest.restoreAllMocks());

    test("thunkCreateTeam creates team", async () => {
        global.fetch = mockFetch({ success: true, data: { team: { id: 1, name: "My Team" } } });
        const store = configureStore({ reducer: { teams: teamsReducer } });
        await store.dispatch(thunkCreateTeam({ name: "My Team" }));
        expect(store.getState().teams.current?.name).toBe("My Team");
    });
});
