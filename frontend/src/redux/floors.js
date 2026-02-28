
const CREATE_FLOOR = 'floors/createFloor';
const LOAD_FLOORS = 'floors/loadFloors';
const EDIT_FLOOR = 'floor/editFloor';
const REMOVE_FLOOR = 'floor/removeFloor';

const createFloor = (floor) => ({
    type: CREATE_FLOOR,
    payload: floor
})

const loadFloors = (floors) => ({
    type: LOAD_FLOORS,
    payload: floors
})

const editFloor = (floor) => ({
    type: EDIT_FLOOR,
    payload: floor
})

const removeFloor = (floor) => ({
    type: REMOVE_FLOOR,
    payload: floor
})

const initialState = {floors: null}

export default function floorsReducer(state=initialState, action) {
    switch(action.type) {
        case CREATE_FLOOR:
            return
        case LOAD_FLOORS:
            return
        case EDIT_FLOOR:
            return
        case REMOVE_FLOOR:
            return
        default:
            return state;
    }
}