
const LOAD_USERS = "users/loadUsers";
const REMOVE_USER = "users/removeUser";
const UPDATE_USER = "users/updateUser";

// Load users by post and when searching for users 
const loadUsers = (users) => ({
    type: LOAD_USERS,
    payload: users
})

// Remove users from a post
const removeUser = (user) => ({
    type: REMOVE_USER,
    payload: user
})

// Updates a user for thinking like viewing post permissions
const updateUser = (user) => ({
    type: UPDATE_USER,
    payload: user
})

const initialState = {users: null}

export default function usersReducer(state=initialState, action) {
    switch(action.type) {
        case LOAD_USERS:
            return 
        case REMOVE_USER:
            return 
        case UPDATE_USER:
            return
        default:
            return state;
    }
}