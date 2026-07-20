import { configureStore } from "@reduxjs/toolkit"

import sessionReducer from "./session"
import settingsReducer from "./settings"
import propertiesReducer from "./properties"
import floorsReducer from "./floors"
import pointsReducer from "./points"
import savedTypesReducer from "./savedTypes"
import roomsReducer from "./rooms"
import mapsReducer from "./maps"
import overlaysReducer from "./overlays"

export const reduxStore = configureStore({
    reducer: {
        session: sessionReducer,
        settings: settingsReducer,
        properties: propertiesReducer,
        floors: floorsReducer,
        points: pointsReducer,
        savedTypes: savedTypesReducer,
        rooms: roomsReducer,
        maps: mapsReducer,
        overlays: overlaysReducer,
    }
})
