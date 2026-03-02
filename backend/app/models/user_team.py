from pydantic import BaseModel

class UserTeam(BaseModel):
    user_id: int
    team_id: int
    roles: str