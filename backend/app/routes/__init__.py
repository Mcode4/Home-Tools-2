from fastapi import APIRouter, Response
from app.routes.auth import router as auth_router
from app.routes.property import router as property_router
from app.routes.images import router as image_router
from app.routes.users import router as users_router
from app.routes.floors import router as floors_router
from app.routes.points import router as point_router
from app.routes.saved_types import router as saved_types_router
from app.routes.settings import router as settings_router
from app.routes.home_groups import router as home_groups_router
from app.routes.notifications import router as notifications_router
from app.routes.teams import router as teams_router
from app.routes.renders import router as renders_router
from app.routes.rooms import router as rooms_router

router = APIRouter(prefix="/api", tags=["API"])

router.include_router(auth_router)
router.include_router(property_router)
router.include_router(image_router)
router.include_router(users_router)
router.include_router(floors_router)
router.include_router(point_router)
router.include_router(saved_types_router)
router.include_router(settings_router)
router.include_router(home_groups_router)
router.include_router(notifications_router)
router.include_router(teams_router)
router.include_router(rooms_router)
router.include_router(renders_router)

@router.get("/")
def health_check():
    return {"status", "API running"}