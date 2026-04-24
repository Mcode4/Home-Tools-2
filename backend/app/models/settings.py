from pydantic import BaseModel
from typing import Optional

class Settings(BaseModel):
    theme: str = "dark" # "light", "dark", "blueprint"
    map_layer: str = "osm-layer" # "osm-layer", "satellite-layer"
    icon_size: int = 24
    text_size: int = 12
    text_color: Optional[str] = None # Adaptive if null
    
class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    map_layer: Optional[str] = None
    icon_size: Optional[int] = None
    text_size: Optional[int] = None
    text_color: Optional[str] = None
