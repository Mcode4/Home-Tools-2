const GET_MAPS = "maps/GET_MAPS";
const CREATE_MAP = "maps/CREATE_MAP";
const UPDATE_MAP = "maps/UPDATE_MAP";
const DELETE_MAP = "maps/DELETE_MAP";

// Actions
const getMaps = (data) => ({
    type: GET_MAPS,
    payload: data,
});

const createMap = (data) => ({
    type: CREATE_MAP,
    payload: data,
});

const updateMap = (data) => ({
    type: UPDATE_MAP,
    payload: data,
});

const deleteMap = (id) => ({
    type: DELETE_MAP,
    payload: id,
});

// Thunks
export const thunkGetAllMaps = () => async (dispatch) => {
    try {
        const response = await fetch("/api/maps/");
        if (response.ok) {
            const data = await response.json();
            dispatch(getMaps(data));
            return { success: true, data };
        } else {
            const err = await response.json();
            return { success: false, detail: err.detail };
        }
    } catch (e) {
        return { success: false, detail: "Network error" };
    }
};

export const thunkCreateMap = (mapData) => async (dispatch) => {
    try {
        const response = await fetch("/api/maps/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(mapData),
        });

        if (response.ok) {
            const data = await response.json();
            dispatch(createMap(data));
            return { success: true, data };
        } else {
            const err = await response.json();
            return { success: false, detail: err.detail };
        }
    } catch (e) {
        return { success: false, detail: "Network error" };
    }
};

export const thunkUpdateMap = (id, mapData) => async (dispatch) => {
    try {
        const response = await fetch(`/api/maps/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(mapData),
        });

        if (response.ok) {
            const data = await response.json();
            dispatch(updateMap(data));
            return { success: true, data };
        } else {
            const err = await response.json();
            return { success: false, detail: err.detail };
        }
    } catch (e) {
        return { success: false, detail: "Network error" };
    }
};

export const thunkDeleteMap = (id) => async (dispatch) => {
    try {
        const response = await fetch(`/api/maps/${id}`, {
            method: "DELETE",
        });

        if (response.ok) {
            dispatch(deleteMap(id));
            return { success: true };
        } else {
            const err = await response.json();
            return { success: false, detail: err.detail };
        }
    } catch (e) {
        return { success: false, detail: "Network error" };
    }
};

// Reducer
const initialState = {
    data: [],
};

export default function mapsReducer(state = initialState, action) {
    switch (action.type) {
        case GET_MAPS:
            return { ...state, data: action.payload };
        case CREATE_MAP:
            return { ...state, data: [...state.data, action.payload] };
        case UPDATE_MAP:
            return {
                ...state,
                data: state.data.map((map) =>
                    map.id === action.payload.id ? action.payload : map
                ),
            };
        case DELETE_MAP:
            return {
                ...state,
                data: state.data.filter((map) => map.id !== action.payload),
            };
        default:
            return state;
    }
}
