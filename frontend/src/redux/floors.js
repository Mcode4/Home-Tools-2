import { checkAndReturnRes } from "./apiUtils";

const LOAD_FLOORS = "floors/loadFloors";
const CREATE_FLOOR = "floors/createFloor";
const EDIT_FLOOR = "floors/editFloor";
const DELETE_FLOOR = "floors/deleteFloor";

const loadFloors = (floors) => ({ type: LOAD_FLOORS, payload: floors });
const createFloor = (floor) => ({ type: CREATE_FLOOR, payload: floor });
const editFloor = (floor) => ({ type: EDIT_FLOOR, payload: floor });
const deleteFloor = (id) => ({ type: DELETE_FLOOR, payload: id });

export const thunkGetFloors = (propertyId) => async (dispatch) => {
    const res = await fetch(`/api/floors/${propertyId}/all`, { credentials: "include" });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(loadFloors(check.data.data.floors));
    return check.data;
};

export const thunkCreateFloor = (floorObj) => async (dispatch) => {
    const res = await fetch("/api/floors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(floorObj),
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(createFloor(check.data.data.floor));
    return check.data;
};

export const thunkEditFloor = (id, floorObj) => async (dispatch) => {
    const res = await fetch(`/api/floors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(floorObj),
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(editFloor(check.data.data.floor));
    return check.data;
};

export const thunkDeleteFloor = (id) => async (dispatch) => {
    const res = await fetch(`/api/floors/${id}`, {
        method: "DELETE",
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(deleteFloor(id));
    return check.data;
};

const initialState = { data: [] };

export default function floorsReducer(state = initialState, action) {
    switch (action.type) {
        case LOAD_FLOORS:
            return { ...state, data: action.payload };
        case CREATE_FLOOR:
            return { ...state, data: [...state.data, action.payload] };
        case EDIT_FLOOR:
            return { ...state, data: state.data.map(f => f.id === action.payload.id ? action.payload : f) };
        case DELETE_FLOOR:
            return { ...state, data: state.data.filter(f => f.id !== action.payload) };
        default:
            return state;
    }
}
