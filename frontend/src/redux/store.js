import { configureStore } from "@reduxjs/toolkit"

import sessionReducer from "./session"
import settingsReducer from "./settings"
import usersReducer from "./users"
import propertiesReducer from "./properties"
import floorsReducer from "./floors"
import imagesReducer from "./images"
import pointsReducer from "./points"
import savedTypesReducer from "./savedTypes"
import homeGroupsReducer from "./homeGroups"
import notificationsReducer from "./notifications"
import teamsReducer from "./teams"
import roomsReducer from "./rooms"

export const reduxStore = configureStore({
    reducer: {
        session: sessionReducer,
        settings: settingsReducer,
        users: usersReducer,
        properties: propertiesReducer,
        floors: floorsReducer,
        images: imagesReducer,
        points: pointsReducer,
        savedTypes: savedTypesReducer,
        homeGroups: homeGroupsReducer,
        notifications: notificationsReducer,
        teams: teamsReducer,
        rooms: roomsReducer,
    }
})
