from fastapi import APIRouter, Response


router = APIRouter(prefix="/api", tags=["API"])

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