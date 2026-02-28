import { configureStore, combineReducers} from "@reduxjs/toolkit"

import sessionReducer from "./session"
import usersReducer from "./users"
import propertiesReducer from "./properties"
import floorsReducer from "./floors"
import imagesReducer from "./images"

const rootReducer = combineReducers({
    session: sessionReducer,
    users: usersReducer,
    properties: propertiesReducer,
    floors: floorsReducer,
    images: imagesReducer
})

export const reduxStore = configureStore({
    reducer: {
        root: rootReducer
    }
})