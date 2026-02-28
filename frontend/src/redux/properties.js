const CREATE_PROPERTY = 'properties/createProperty';
const LOAD_PROPERTIES = 'properties/loadProperties';
const EDIT_PROPERTY = 'properties/editProperty';
const REMOVE_PROPERTY = 'properties/removeProperty';

const createProperty = (property) => ({
    type: CREATE_PROPERTY,
    payload: property
})

const loadProperties = (properties) => ({
    type: LOAD_PROPERTIES,
    payload: properties
})

const editProperty = (property) => ({
    type: EDIT_PROPERTY,
    payload: property
})

const removeProperty = (property) => ({
    type: REMOVE_PROPERTY,
    payload: property
})


const initialState = {properties: null} // {properties: {properties: [], sharedProperties: [for teams]} }

export default function propertiesReducer(state=initialState, action) {
    switch(action.type) {
        case CREATE_PROPERTY:
            return
        case LOAD_PROPERTIES:
            return
        case EDIT_PROPERTY:
            return
        case REMOVE_PROPERTY:
            return
        default:
            return state
    }
}