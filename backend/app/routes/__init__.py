from fastapi import APIRouter, Response
from app.routes.auth import router as auth_router
from app.routes.property import router as property_router
from app.routes.images import router as image_router
from app.routes.users import router as users_router
from app.routes.floors import router as floors_router
from app.routes.points import router as point_router

router = APIRouter(prefix="/api", tags=["API"])

router.include_router(auth_router)
router.include_router(property_router)
router.include_router(image_router)
router.include_router(users_router)
router.include_router(floors_router)
router.include_router(point_router)

@router.get("/")
def health_check():
    return {"status", "API running"}