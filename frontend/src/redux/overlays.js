import { checkAndReturnRes } from "./apiUtils";

const TOGGLE_OVERLAY = "overlays/toggleOverlay";
const SET_OVERLAY_DATA = "overlays/setOverlayData";

export const toggleOverlay = (mapId) => ({
    type: TOGGLE_OVERLAY,
    payload: mapId
});

const setOverlayData = (mapId, points, properties) => ({
    type: SET_OVERLAY_DATA,
    payload: { mapId, points, properties }
});

export const thunkToggleOverlay = (mapId) => async (dispatch, getState) => {
    dispatch(toggleOverlay(mapId));
    
    // Check if it's now active
    const state = getState();
    const isActive = state.overlays.activeMapIds.includes(mapId);
    const hasData = state.overlays.points[mapId] !== undefined;

    if (isActive && !hasData) {
        // Fetch points and properties for this map
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
                // Do not dispatch, so hasData remains false and it will retry next time
            }
        } catch (e) {
            console.error("Error fetching overlay data", e);
        }
    }
};

const initialState = {
    activeMapIds: [],
    points: {},
    properties: {}
};

export default function overlaysReducer(state = initialState, action) {
    switch(action.type){
        case TOGGLE_OVERLAY: {
            const mapId = action.payload;
            const isActive = state.activeMapIds.includes(mapId);
            return {
                ...state,
                activeMapIds: isActive 
                    ? state.activeMapIds.filter(id => id !== mapId)
                    : [...state.activeMapIds, mapId]
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
