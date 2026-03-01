def ResponseModel(self, success: bool, message: str, data:dict=None):
        res = {
            "success": success,
            "message": message
        }
        if data:
            res["data"] = data
        return res