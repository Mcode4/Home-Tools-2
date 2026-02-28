
const ADD_IMAGE = 'images/addImage';
const LOAD_IMAGES = 'images/loadImages';
const UPDATE_IMAGE = 'images/updateImage';
const REMOVE_IMAGE = 'images/removeImage';

const addImage = (image) => ({
    type: ADD_IMAGE,
    payload: image
})

const loadImages = (images) => ({
    type: LOAD_IMAGES,
    payload: images
})

const updateImage = (image) => ({
    type: UPDATE_IMAGE,
    payload: image
})

const removeImage = (image) => ({
    type: REMOVE_IMAGE,
    payload: image
})


const initialState = {images: null} // {images: {propertyImages: {}, profileImages: {}}}

export default function imagesReducer(state=initialState, action) {
    switch(action.type) {
        case ADD_IMAGE:
            return 
        case LOAD_IMAGES:
            return 
        case UPDATE_IMAGE:
            return 
        case REMOVE_IMAGE:
            return 
        default:
            return state;
    }
}