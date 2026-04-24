# Import all the models, so that Base has them before being
# imported by Alembic or used by create_all()
from app.db.session import Base
from app.models.user import User
from app.models.team import Team
from app.models.user_team import UserTeam
from app.models.property import Property
from app.models.point import Point
from app.models.home_group import HomeGroup
from app.models.floor import Floor
from app.models.image import Image
from app.models.notification import Notification
from app.models.saved_types import SavedType
from app.models.settings import Settings
