import config

import os

class MyService:

    def __init__(self):
        pass

    def add(self, a: float, b: float):
        return a + b

    def multiply(self, a: float, b: float):
        return a * b

    def get_credentials(self):
        if config.env == "dev":
            os.environ["MY_SECRET"] = "mydevpassword"
        return os.environ.get("MY_SECRET")
