import { checkAndReturnRes } from "./apiUtils";

const LOAD_SETTINGS = "settings/loadSettings";
const UPDATE_SETTINGS = "settings/updateSettings";

const loadSettings = (settings) => ({
    type: LOAD_SETTINGS,
    payload: settings
});

const updateSettings = (settings) => ({
    type: UPDATE_SETTINGS,
    payload: settings
});

export const thunkGetSettings = () => async(dispatch) => {
    const res = await fetch("/api/settings/", {
        method: "GET",
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if(check.ok) {
        await dispatch(loadSettings(check.data.data.settings));
    };
    return check.data;
}

export const thunkUpdateSettings = (settingsObj) => async(dispatch) => {
    const res = await fetch("/api/settings/", {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(settingsObj),
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if(check.ok) {
        await dispatch(updateSettings(check.data.data.settings));
    };
    return check.data;
}

const initialState = {
    theme: "dark",
    map_layer: "osm-layer",
    icon_size: 24,
    text_size: 12,
    text_color: null
};

export default function settingsReducer(state = initialState, action) {
    switch(action.type){
        case LOAD_SETTINGS:
            return { ...action.payload };
        case UPDATE_SETTINGS:
            return { ...state, ...action.payload };
        default:
            return state;
    }
}
