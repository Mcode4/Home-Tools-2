import { checkAndReturnRes } from "./apiUtils";

const LOAD_IMAGES = "images/loadImages";
const ADD_IMAGE = "images/addImage";
const REPLACE_IMAGE = "images/replaceImage";
const DELETE_IMAGE = "images/deleteImage";

const loadImages = (images) => ({ type: LOAD_IMAGES, payload: images });
const addImage = (image) => ({ type: ADD_IMAGE, payload: image });
const replaceImage = (image) => ({ type: REPLACE_IMAGE, payload: image });
const deleteImage = (id) => ({ type: DELETE_IMAGE, payload: id });

export const thunkGetImageById = (id) => async (dispatch) => {
    const res = await fetch(`/api/images/${id}`, { credentials: "include" });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(loadImages([check.data]));
    return check.data;
};

export const thunkAddImage = (formData) => async (dispatch) => {
    const res = await fetch("/api/images", {
        method: "POST",
        body: formData,
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(addImage(check.data.data));
    return check.data;
};

export const thunkReplaceImage = (id, formData) => async (dispatch) => {
    const res = await fetch(`/api/images/${id}`, {
        method: "PUT",
        body: formData,
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(replaceImage(check.data.data));
    return check.data;
};

export const thunkDeleteImage = (id) => async (dispatch) => {
    const res = await fetch(`/api/images/${id}`, {
        method: "DELETE",
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(deleteImage(id));
    return check.data;
};

const initialState = { data: [] };

export default function imagesReducer(state = initialState, action) {
    switch (action.type) {
        case LOAD_IMAGES:
            return { ...state, data: action.payload };
        case ADD_IMAGE:
            return { ...state, data: [...state.data, action.payload] };
        case REPLACE_IMAGE:
            return { ...state, data: state.data.map(img => img.id === action.payload.id ? action.payload : img) };
        case DELETE_IMAGE:
            return { ...state, data: state.data.filter(img => img.id !== action.payload) };
        default:
            return state;
    }
}
