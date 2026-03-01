import os
import uuid
from fastapi import HTTPException, UploadFile, File

from app.models.image import Image

UPLOAD_ROOT = "app/uploads/"

# Upload Image
def upload_image(image: Image, file: UploadFile = File(...)):
    try:
        if file.content_type not in {"image/jpeg", "image/png", "image/webp", "image/jpg"}:
            raise HTTPException(status_code=400, detail="Invalid image type")
        UPLOAD_DIR = UPLOAD_ROOT + f'{image.owner_id}/'
        if image.type == "property":
            UPLOAD_DIR += 'property/'
        else:
            UPLOAD_DIR += 'user/'
        image_dir = os.path.join(UPLOAD_DIR, str(image.owner_id))
        os.makedirs(image_dir, exists_ok=True)
        ext = os.path.splitext(file.filename)[1]
        filename = f'{uuid.uuid4()}{ext}'
        filepath = os.path.join(image_dir, filename)
        with open(filepath, "wb") as f:
            f.write(file.file.read())
        return {"filename": filename, "filepath": filepath}
    except:
        return False
    

# Delete Image
def delete_image(filepath: str):
    if os.path.exists(filepath):
        os.remove(filepath)
        return True
    else:
        return False
    
        