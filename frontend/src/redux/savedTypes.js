import { checkAndReturnRes } from "./apiUtils";

const GET_SAVED_TYPES = "savedTypes/GET_SAVED_TYPES";
const CREATE_SAVED_TYPE = "savedTypes/CREATE_SAVED_TYPE";
const DELETE_SAVED_TYPE = "savedTypes/DELETE_SAVED_TYPE";

const getSavedTypes = (types) => ({
    type: GET_SAVED_TYPES,
    payload: types
});

const createSavedType = (type) => ({
    type: CREATE_SAVED_TYPE,
    payload: type
});

const removeSavedType = (id) => ({
    type: DELETE_SAVED_TYPE,
    payload: id
});

export const thunkGetSavedTypes = () => async (dispatch) => {
    const res = await fetch("/api/types");
    const check = await checkAndReturnRes(res);
    if (check.ok) {
        dispatch(getSavedTypes(check.data.data.types));
    }
    return check;
};

export const thunkCreateSavedType = (savedType) => async (dispatch) => {
    const res = await fetch("/api/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savedType)
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) {
        dispatch(createSavedType(check.data.data.type));
    }
    return check;
};

export const thunkDeleteSavedType = (id) => async (dispatch) => {
    const res = await fetch(`/api/types/${id}`, {
        method: "DELETE"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) {
        dispatch(removeSavedType(id));
    }
    return check;
};

const initialState = { data: [] };

const savedTypesReducer = (state = initialState, action) => {
    switch (action.type) {
        case GET_SAVED_TYPES:
            return { ...state, data: action.payload };
        case CREATE_SAVED_TYPE:
            return { ...state, data: [...state.data, action.payload] };
        case DELETE_SAVED_TYPE:
            return { ...state, data: state.data.filter(t => t.id !== action.payload) };
        default:
            return state;
    }
};

export default savedTypesReducer;
