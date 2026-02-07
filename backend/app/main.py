from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from . import models, database
from .routers import books, students, classes, streams, circulation, analytics, users, auth, config, logs

load_dotenv()

# Initialize tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Library Star Pro API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, tags=["Auth"])
app.include_router(books.router, tags=["Books"])
app.include_router(students.router, tags=["Students"])
app.include_router(classes.router, tags=["Classes"])
app.include_router(streams.router, tags=["Streams"])
app.include_router(circulation.router, tags=["Circulation"])
app.include_router(users.router, tags=["Users"])
app.include_router(analytics.router, tags=["Analytics"])
app.include_router(config.router, prefix="/config", tags=["Config"])
app.include_router(logs.router, prefix="/logs", tags=["Logs"])

@app.get("/")
async def root():
    return {"message": "Welcome to Library Star Pro API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
