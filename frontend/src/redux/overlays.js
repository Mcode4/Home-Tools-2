import { checkAndReturnRes } from "./apiUtils";

const ADD_WORKSPACE = "overlays/addWorkspace";
const REMOVE_WORKSPACE = "overlays/removeWorkspace";
const TOGGLE_VISIBILITY = "overlays/toggleVisibility";
const SET_OVERLAY_DATA = "overlays/setOverlayData";

export const addWorkspace = (mapId) => ({ type: ADD_WORKSPACE, payload: mapId });
export const removeWorkspace = (mapId) => ({ type: REMOVE_WORKSPACE, payload: mapId });
export const toggleVisibility = (mapId) => ({ type: TOGGLE_VISIBILITY, payload: mapId });

const setOverlayData = (mapId, points, properties) => ({
    type: SET_OVERLAY_DATA,
    payload: { mapId, points, properties }
});

export const thunkAddWorkspace = (mapId) => async (dispatch, getState) => {
    dispatch(addWorkspace(mapId));
    
    // Check if it has data
    const state = getState();
    const hasData = state.overlays.points[mapId] !== undefined;

    if (!hasData) {
        try {
            const [pointsRes, propsRes] = await Promise.all([
                fetch(`/api/points/all?map_id=${mapId}`, { credentials: "include" }),
                fetch(`/api/property/all?map_id=${mapId}`, { credentials: "include" })
            ]);
            
            const pointsCheck = await checkAndReturnRes(pointsRes);
            const propsCheck = await checkAndReturnRes(propsRes);

            if (pointsCheck.ok && propsCheck.ok) {
                const points = pointsCheck.data.data.points || [];
                const properties = propsCheck.data.data.properties || [];
                dispatch(setOverlayData(mapId, points, properties));
            } else {
                console.error("Failed to fetch overlay data: backend returned not ok");
            }
        } catch (e) {
            console.error("Error fetching overlay data", e);
        }
    }
};

export const thunkRemoveWorkspace = (mapId) => (dispatch) => {
    dispatch(removeWorkspace(mapId));
};

export const thunkToggleVisibility = (mapId) => (dispatch) => {
    dispatch(toggleVisibility(mapId));
};

const initialState = {
    workspaceMapIds: [],
    visibleMapIds: [],
    points: {},
    properties: {}
};

export default function overlaysReducer(state = initialState, action) {
    switch(action.type) {
        case ADD_WORKSPACE: {
            const mapId = action.payload;
            if (state.workspaceMapIds.includes(mapId)) return state;
            return {
                ...state,
                workspaceMapIds: [...state.workspaceMapIds, mapId],
                // When added to workspace, automatically make it visible
                visibleMapIds: [...state.visibleMapIds, mapId] 
            };
        }
        case REMOVE_WORKSPACE: {
            const mapId = action.payload;
            return {
                ...state,
                workspaceMapIds: state.workspaceMapIds.filter(id => id !== mapId),
                visibleMapIds: state.visibleMapIds.filter(id => id !== mapId)
            };
        }
        case TOGGLE_VISIBILITY: {
            const mapId = action.payload;
            const isVisible = state.visibleMapIds.includes(mapId);
            return {
                ...state,
                visibleMapIds: isVisible 
                    ? state.visibleMapIds.filter(id => id !== mapId)
                    : [...state.visibleMapIds, mapId]
            };
        }
        case SET_OVERLAY_DATA: {
            const { mapId, points, properties } = action.payload;
            return {
                ...state,
                points: { ...state.points, [mapId]: points },
                properties: { ...state.properties, [mapId]: properties }
            };
        }
        default:
            return state;
    }
}
