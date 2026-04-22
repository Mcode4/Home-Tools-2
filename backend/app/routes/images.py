import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from app.db.db import get_db
from app.models.image import Image
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user
from app.utils.image_utils import upload_image, delete_image

load_dotenv()
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/images", tags=["Images"])

# Get Image By ID
@router.get("/{id}")
def get_image_by_id(id: int, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT filepath, property_id FROM images WHERE id=%s AND owner_id=%s", (id, current_user["id"],))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Image not found")
    if not os.path.exists(row["filepath"]):
        raise HTTPException(status_code=404, detail="File missing")
    return FileResponse(row["filepath"])


# Upload Images
@router.post("")
def add_image(image: Image, file: UploadFile = File(...), current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    if image.type == "property":
        cursor.execute("SELECT * FROM property WHERE id=%s", (image.property_id,))
        curr_prop = cursor.fetchone()
        if not curr_prop:
            conn.close()
            raise HTTPException(status_code=404, detail="Property not found")
        if curr_prop["owner_id"] != current_user["id"]:
            conn.close()
            raise HTTPException(status_code=401, detail="User not authorized to add image to property")
            
    uploaded_img = upload_image(image, file)
    if not uploaded_img:
        conn.close()
        return ResponseModel(False, "Failed to upload image")
        
    cursor.execute(
        """
            INSERT INTO images (owner_id, property_id, default_filename, filename, filepath, content_type, size, type)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """,
        (
            current_user["id"],
            image.property_id,
            image.default_filename,
            uploaded_img["filename"],
            uploaded_img["filepath"],
            file.content_type,
            os.path.getsize(uploaded_img["filepath"]),
            image.type,
        )
    )
    conn.commit()
    id = cursor.fetchone()["id"]
    conn.close()
    return ResponseModel(True, "", data={
        "id": id, 
        "property_id": image.property_id,
        "filename": uploaded_img["filename"]
    })


# Replace Image
@router.put("/{id}")
def replace_image(id: int, image: Image, file: UploadFile = File(...), current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM images WHERE id=%s AND owner_id=%s", (id, current_user["id"],))
    curr_image = cursor.fetchone()
    if not curr_image:
        conn.close()
        raise HTTPException(status_code=404, detail="Image not found")
        
    deleted = delete_image(curr_image["filepath"])
    if deleted:
        cursor.execute("DELETE FROM images WHERE id=%s", (id,))
        conn.commit()
        conn.close()
        return add_image(image, file, current_user)
    return ResponseModel(False, "Failed to replace image")


# Delete Image
@router.delete("/{id}")
def remove_image(id: int, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM images WHERE id=%s AND owner_id=%s", (id, current_user["id"],))
    image = cursor.fetchone()
    if not image:
        conn.close()
        raise HTTPException(status_code=404, detail="Image not found")
        
    deleted = delete_image(image["filepath"])
    if deleted:
        cursor.execute("DELETE FROM images WHERE id=%s", (id,))
        conn.commit()
        conn.close()
        return ResponseModel(True, "Image successfully deleted")
    return ResponseModel(False, "Failed to delete image")