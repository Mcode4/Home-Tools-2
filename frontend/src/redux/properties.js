import { checkAndReturnRes } from "./apiUtils";

const CREATE_PROPERTY = 'properties/createProperty';
const LOAD_PROPERTIES = 'properties/loadProperties';
const EDIT_PROPERTY = 'properties/editProperty';
const REMOVE_PROPERTY = 'properties/removeProperty';

const createProperty = (pinned, property) => ({
    type: CREATE_PROPERTY,
    payload: {pinned, property}
})

const loadProperties = (properties) => ({
    type: LOAD_PROPERTIES,
    payload: properties
})

const editProperty = (id, property) => ({
    type: EDIT_PROPERTY,
    payload: {id, property}
})

const removeProperty = (id) => ({
    type: REMOVE_PROPERTY,
    payload: id
})

// Get All Properties
export const thunkGetAllProperties = () => async(dispatch) => {
    const res = await fetch('/api/property/all', {
        method: "GET",
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    console.log("CHECK", check)
    if(check.ok) {
        await dispatch(loadProperties(check.data.data.properties))
    }

    return check.data;
}

// Get Property By ID
// export const thunkGetPropertyAtId = (id) => async(dispatch) => {
//     const res = await fetch(`/api/property/${id}`, {
//         method: "GET",
//         credentials: "include"
//     });
//     const data = await res.json();
//     if(res.ok) {
//         console.log("RES OK", data);
//     } else {
//         console.log("RES ERROR", data);
//     };

//     return data
// }


// Create Property
export const thunkCreateProperty = (propObj) => async(dispatch) => {
    const res = await fetch('/api/property', {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(propObj),
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if(check.ok) {
        let pin = false
        if(propObj.pinned) {
            pin = true
        }
        await dispatch(createProperty(pin, check.data.data.property))
    }

    return check.data;
}


// Edit Property
export const thunkEditProperty = (id, propObj) => async(dispatch) => {
    const res = await fetch(`/api/property/${id}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: propObj,
        credentials: "include"
    })
    const check = await checkAndReturnRes(res);
    if(check.ok) {
        await dispatch(editProperty(id, check.data.data.property))
    }

    return check.data;
}


// Delete Property By ID
export const thunkDeleteProperty = (id) => async(dispatch) => {
    const res = await fetch(`/api/property/${id}`, {
        method: "DELETE",
        credentials: "include"
    })
    const check = await checkAndReturnRes(res);
    if(check.ok) {
        await dispatch(removeProperty(id))
    }

    return check.data;
}


const initialState = {pinned: [], other: []} // {properties: {properties: [], sharedProperties: [for teams]} }

export default function propertiesReducer(state=initialState, action) {
    switch(action.type) {
        case CREATE_PROPERTY:
            if(action.payload.pinned) {
                return {...state, pinned: [...state.pinned, action.payload.property]}
            }
            return {...state, other: [...state.other, action.payload.property]}
        case LOAD_PROPERTIES:
            return {
                ...state,
                pinned: action.payload.pinned,
                other: action.payload.other
            }
        case EDIT_PROPERTY:
            return
        case REMOVE_PROPERTY:
            return
        default:
            return state
    }
}