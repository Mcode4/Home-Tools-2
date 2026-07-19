from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.models.render import Render, RenderSchema
from app.models.property import Property
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user

router = APIRouter(prefix="/renders", tags=["Renders"])

@router.get("/{property_id}")
def get_render(property_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    prop = db.query(Property).filter(Property.id == property_id, Property.owner_id == current_user["id"]).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    render = db.query(Render).filter(Render.property_id == property_id).first()
    if not render:
        return ResponseModel(True, "", {"render": None})
    return ResponseModel(True, "", {"render": render})

@router.post("/{property_id}")
def create_or_update_render(property_id: int, render_schema: RenderSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    prop = db.query(Property).filter(Property.id == property_id, Property.owner_id == current_user["id"]).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    render = db.query(Render).filter(Render.property_id == property_id).first()
    if render:
        render.has_render = render_schema.has_render
        render.has_outline = render_schema.has_outline
        render.has_sections = render_schema.has_sections
        if render_schema.outlines_data is not None:
            render.outlines_data = render_schema.outlines_data
        if render_schema.sections_data is not None:
            render.sections_data = render_schema.sections_data
        if render_schema.objects_data is not None:
            render.objects_data = render_schema.objects_data
        if render_schema.render_3d_data is not None:
            render.render_3d_data = render_schema.render_3d_data
    else:
        render = Render(
            property_id=property_id,
            has_render=render_schema.has_render,
            has_outline=render_schema.has_outline,
            has_sections=render_schema.has_sections,
            outlines_data=render_schema.outlines_data,
            sections_data=render_schema.sections_data,
            objects_data=render_schema.objects_data,
            render_3d_data=render_schema.render_3d_data,
        )
        db.add(render)
    db.commit()
    db.refresh(render)
    return ResponseModel(True, "Render saved", {"render": render})
