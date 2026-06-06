import { checkAndReturnRes } from "./apiUtils";

const LOAD_USERS = "users/loadUsers";
const SET_CURRENT_USER = "users/setCurrentUser";

const loadUsers = (users) => ({ type: LOAD_USERS, payload: users });
const setCurrentUser = (user) => ({ type: SET_CURRENT_USER, payload: user });

export const thunkGetAllUsers = () => async (dispatch) => {
    const res = await fetch("/api/users/all", { credentials: "include" });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(loadUsers(check.data.data.users));
    return check.data;
};

export const thunkGetUserById = (id) => async (dispatch) => {
    const res = await fetch(`/api/users/${id}`, { credentials: "include" });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(setCurrentUser(check.data.data.user));
    return check.data;
};

export const thunkUpdateProfile = (profileObj) => async (dispatch) => {
    const res = await fetch("/api/users/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileObj),
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) {
        dispatch(setCurrentUser(check.data.data.user));
    }
    return check.data;
};

export const thunkUpdateAccount = (accountObj) => async (dispatch) => {
    const res = await fetch("/api/users/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountObj),
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(setCurrentUser(check.data.data.user));
    return check.data;
};

export const thunkDeleteUser = (password) => async (dispatch) => {
    const res = await fetch(`/api/users/?password=${encodeURIComponent(password)}`, {
        method: "DELETE",
        credentials: "include"
    });
    return (await res.json());
};

const initialState = { data: [], current: null };

export default function usersReducer(state = initialState, action) {
    switch (action.type) {
        case LOAD_USERS:
            return { ...state, data: action.payload };
        case SET_CURRENT_USER:
            return { ...state, current: action.payload };
        default:
            return state;
    }
}
