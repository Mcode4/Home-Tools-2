from fastapi import APIRouter, Response
from app.routes.auth import router as auth_router
from app.routes.property import router as property_router
from app.routes.images import router as image_router
from app.routes.users import router as users_router
from app.routes.floors import router as floors_router

router = APIRouter(prefix="/api", tags=["API"])

router.include_router(auth_router)
router.include_router(property_router)
router.include_router(image_router)
router.include_router(users_router)
router.include_router(floors_router)

@router.get("/")
def health_check():
    return {"status", "API running"}

@router.delete("/session")
def logout_user(response: Response):
    response.set_cookie(
        key="access_token",
        value="",
        httponly=True,
        max_age=0,
        samesite="none",
        secure=True,
        path="/"
    )
    response.delete_cookie("access_token", path="/")
    return {"message": "Logged out successfully"}