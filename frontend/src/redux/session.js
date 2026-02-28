
const SET_USER = 'session/setUser';
const REMOVE_USER = 'session/removeUser';
const EDIT_USER = 'session/editUser';

const setUser = (user) => ({
    type: SET_USER,
    payload: user
})

const removeUser = (user) => ({
    type: REMOVE_USER,
    payload: user
})

const editUser = (user) => ({
    type: EDIT_USER,
    payload: user
})

const initialState = {session: null}

export default function sessionReducer(state=initialState, action) {
    switch(action.type) {
        case SET_USER:
            return
        case REMOVE_USER:
            return
        case EDIT_USER:
            return
        default:
            return state;
    }
}