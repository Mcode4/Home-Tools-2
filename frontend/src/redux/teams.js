import { checkAndReturnRes } from "./apiUtils";

const LOAD_TEAMS = "teams/loadTeams";
const SET_CURRENT_TEAM = "teams/setCurrentTeam";

const loadTeams = (teams) => ({ type: LOAD_TEAMS, payload: teams });
const setCurrentTeam = (team) => ({ type: SET_CURRENT_TEAM, payload: team });

export const thunkGetTeamMembers = (teamId) => async (dispatch) => {
    const res = await fetch(`/api/teams/${teamId}`, { credentials: "include" });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(setCurrentTeam(check.data.data));
    return check.data;
};

export const thunkCreateTeam = (teamObj) => async (dispatch) => {
    const res = await fetch("/api/teams/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamObj),
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if (check.ok) dispatch(setCurrentTeam(check.data.data.team));
    return check.data;
};

const initialState = { data: [], current: null };

export default function teamsReducer(state = initialState, action) {
    switch (action.type) {
        case LOAD_TEAMS:
            return { ...state, data: action.payload };
        case SET_CURRENT_TEAM:
            return { ...state, current: action.payload };
        default:
            return state;
    }
}
