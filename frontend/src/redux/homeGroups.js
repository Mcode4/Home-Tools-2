import { checkAndReturnRes } from "./apiUtils";

const LOAD_GROUPS = "homeGroups/loadGroups";
const CREATE_GROUP = "homeGroups/createGroup";
const EDIT_GROUP = "homeGroups/editGroup";
const DELETE_GROUP = "homeGroups/deleteGroup";

const loadGroups = (groups) => ({ type: LOAD_GROUPS, payload: groups });
const createGroup = (group) => ({ type: CREATE_GROUP, payload: group });
const editGroup = (group) => ({ type: EDIT_GROUP, payload: group });
const deleteGroup = (id) => ({ type: DELETE_GROUP, payload: id });

export const thunkGetGroups = () => async (dispatch) => {
    const res = await fetch("/api/groups", { credentials: "include" });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(loadGroups(check.data.data.groups));
    return check.data;
};

export const thunkCreateGroup = (groupObj) => async (dispatch) => {
    const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupObj),
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(createGroup(check.data.data.group));
    return check.data;
};

export const thunkEditGroup = (id, groupObj) => async (dispatch) => {
    const res = await fetch(`/api/groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupObj),
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(editGroup(check.data.data.group));
    return check.data;
};

export const thunkDeleteGroup = (id) => async (dispatch) => {
    const res = await fetch(`/api/groups/${id}`, {
        method: "DELETE",
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(deleteGroup(id));
    return check.data;
};

const initialState = { data: [] };

export default function homeGroupsReducer(state = initialState, action) {
    switch (action.type) {
        case LOAD_GROUPS:
            return { ...state, data: action.payload };
        case CREATE_GROUP:
            return { ...state, data: [...state.data, action.payload] };
        case EDIT_GROUP:
            return { ...state, data: state.data.map(g => g.id === action.payload.id ? action.payload : g) };
        case DELETE_GROUP:
            return { ...state, data: state.data.filter(g => g.id !== action.payload) };
        default:
            return state;
    }
}
