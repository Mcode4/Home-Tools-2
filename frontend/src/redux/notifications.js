import { checkAndReturnRes } from "./apiUtils";

const LOAD_NOTIFICATIONS = "notifications/loadNotifications";
const CREATE_NOTIFICATION = "notifications/createNotification";
const MARK_READ = "notifications/markRead";
const DELETE_NOTIFICATION = "notifications/deleteNotification";

const loadNotifications = (notifications) => ({ type: LOAD_NOTIFICATIONS, payload: notifications });
const createNotification = (notification) => ({ type: CREATE_NOTIFICATION, payload: notification });
const markRead = (notification) => ({ type: MARK_READ, payload: notification });
const deleteNotification = (id) => ({ type: DELETE_NOTIFICATION, payload: id });

export const thunkGetNotifications = () => async (dispatch) => {
    const res = await fetch("/api/notifications", { credentials: "include" });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(loadNotifications(check.data.data.notifications));
    return check.data;
};

export const thunkCreateNotification = (notifObj) => async (dispatch) => {
    const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifObj),
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(createNotification(check.data.data.notification));
    return check.data;
};

export const thunkMarkNotificationRead = (id) => async (dispatch) => {
    const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(markRead(check.data.data.notification));
    return check.data;
};

export const thunkClearReadNotifications = () => async (dispatch) => {
    const res = await fetch("/api/notifications/read", {
        method: "DELETE",
        credentials: "include"
    });
    return (await res.json());
};

export const thunkDeleteNotification = (id) => async (dispatch) => {
    const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(deleteNotification(id));
    return check.data;
};

const initialState = { data: [] };

export default function notificationsReducer(state = initialState, action) {
    switch (action.type) {
        case LOAD_NOTIFICATIONS:
            return { ...state, data: action.payload };
        case CREATE_NOTIFICATION:
            return { ...state, data: [...state.data, action.payload] };
        case MARK_READ:
            return { ...state, data: state.data.map(n => n.id === action.payload.id ? { ...n, read: 1 } : n) };
        case DELETE_NOTIFICATION:
            return { ...state, data: state.data.filter(n => n.id !== action.payload) };
        default:
            return state;
    }
}
