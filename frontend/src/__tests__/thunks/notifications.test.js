import { configureStore } from "@reduxjs/toolkit";
import notificationsReducer, { thunkGetNotifications, thunkCreateNotification, thunkDeleteNotification } from "../../redux/notifications";

const mockFetch = (response) =>
    jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(response) }));

describe("notifications thunks", () => {
    afterEach(() => jest.restoreAllMocks());

    test("thunkGetNotifications loads notifications", async () => {
        global.fetch = mockFetch({ success: true, data: { notifications: [{ id: 1, title: "N1" }] } });
        const store = configureStore({ reducer: { notifications: notificationsReducer } });
        await store.dispatch(thunkGetNotifications());
        expect(store.getState().notifications.data).toHaveLength(1);
    });

    test("thunkCreateNotification adds notification", async () => {
        global.fetch = mockFetch({ success: true, data: { notification: { id: 2, title: "N2" } } });
        const store = configureStore({ reducer: { notifications: notificationsReducer } });
        await store.dispatch(thunkCreateNotification({ sender_id: 1, recipient_id: 1, title: "N2", message: "Test" }));
        expect(store.getState().notifications.data).toHaveLength(1);
    });

    test("thunkDeleteNotification removes notification", async () => {
        global.fetch = mockFetch({ success: true });
        const store = configureStore({
            reducer: { notifications: notificationsReducer },
            preloadedState: { notifications: { data: [{ id: 1, title: "N1" }] } },
        });
        await store.dispatch(thunkDeleteNotification(1));
        expect(store.getState().notifications.data).toHaveLength(0);
    });
});
