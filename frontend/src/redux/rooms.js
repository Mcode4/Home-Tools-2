import { checkAndReturnRes } from "./apiUtils";

const LOAD_ROOMS = "rooms/loadRooms";
const CREATE_ROOM = "rooms/createRoom";
const EDIT_ROOM = "rooms/editRoom";
const DELETE_ROOM = "rooms/deleteRoom";

const loadRooms = (rooms) => ({ type: LOAD_ROOMS, payload: rooms });
const createRoom = (room) => ({ type: CREATE_ROOM, payload: room });
const editRoom = (room) => ({ type: EDIT_ROOM, payload: room });
const deleteRoom = (id) => ({ type: DELETE_ROOM, payload: id });

export const thunkGetRooms = (floorId) => async (dispatch) => {
    const res = await fetch(`/api/rooms/${floorId}/all`, { credentials: "include" });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(loadRooms(check.data.data.rooms));
    return check.data;
};

export const thunkCreateRoom = (roomObj) => async (dispatch) => {
    const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomObj),
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(createRoom(check.data.data.room));
    return check.data;
};

export const thunkEditRoom = (id, roomObj) => async (dispatch) => {
    const res = await fetch(`/api/rooms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomObj),
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(editRoom(check.data.data.room));
    return check.data;
};

export const thunkDeleteRoom = (id) => async (dispatch) => {
    const res = await fetch(`/api/rooms/${id}`, {
        method: "DELETE",
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(deleteRoom(id));
    return check.data;
};

const initialState = { data: [] };

export default function roomsReducer(state = initialState, action) {
    switch (action.type) {
        case LOAD_ROOMS:
            return { ...state, data: action.payload };
        case CREATE_ROOM:
            return { ...state, data: [...state.data, action.payload] };
        case EDIT_ROOM:
            return { ...state, data: state.data.map(r => r.id === action.payload.id ? action.payload : r) };
        case DELETE_ROOM:
            return { ...state, data: state.data.filter(r => r.id !== action.payload) };
        default:
            return state;
    }
}
