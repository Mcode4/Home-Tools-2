from sqlalchemy import Column, Integer, TEXT, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base
from pydantic import BaseModel

class UserTeam(Base):
    __tablename__ = "user_teams"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True)
    roles = Column(TEXT, nullable=False)

    # Relationships
    user = relationship("User", back_populates="user_teams")
    team = relationship("Team", back_populates="user_teams")

class UserTeamSchema(BaseModel):
    user_id: int
    team_id: int
    roles: str