from fastapi import FastAPI, __version__
from fastapi.middleware.cors import CORSMiddleware

import config
import service

print(f"Starting FastAPI {__version__} on prod: {config.is_prod}")

app = FastAPI(
    docs_url=None if config.is_prod else "/docs",
    redoc_url=None,
    openapi_url=None if config.is_prod else "/openapi.json",
)

cors = ["http://localhost:4200", "http://127.0.0.1:4200"]

if config.is_prod:
    cors = ["http://monsite"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/")
def root():
    return "Formation CI/CD"


@app.get("/health")
def health():
    return True


@app.get("/versions")
def versions():
    return {"version": config.version, "is_prod": config.is_prod}


@app.get("/add/{a}/{b}")
def add(a: float, b: float):
    s = service.MyService()
    return {"result": s.add(a, b)}


if __name__ == "__main__":
    print(f"FastAPI version: {__version__}")
    import uvicorn
    uvicorn.run("api:app", workers=1, reload=False)

