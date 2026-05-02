from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import os
from dotenv import load_dotenv
import pathlib

# Prometheus metrics
from prometheus_fastapi_instrumentator import Instrumentator

# Load env from parent directory
env_path = pathlib.Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Prometheus instrumentation (exposes /metrics endpoint automatically)
Instrumentator().instrument(app).expose(app)

# Database setup for MySQL
DB_HOST = os.getenv('DB_HOST', 'mysql')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_NAME = os.getenv('DB_NAME', 'taskdb')
DB_USER = os.getenv('DB_USER', 'taskuser')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'taskpass123')

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Task Model
class TaskModel(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default='pending')
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

# Pydantic Models
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

# Create tables
Base.metadata.create_all(bind=engine)

BACKEND_NAME = os.getenv('BACKEND_NAME', 'FastAPI')

# Routes
@app.get("/")
def root():
    return {"message": "FastAPI Task Manager", "backend": BACKEND_NAME, "status": "running"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "backend": BACKEND_NAME, "timestamp": datetime.now().isoformat()}

@app.get("/api/tasks")
def get_tasks():
    db = SessionLocal()
    tasks = db.query(TaskModel).order_by(TaskModel.created_at.desc()).all()
    db.close()
    return {"success": True, "backend": BACKEND_NAME, "data": tasks}

@app.get("/api/tasks/{task_id}")
def get_task(task_id: int):
    db = SessionLocal()
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    db.close()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"success": True, "backend": BACKEND_NAME, "data": task}

@app.post("/api/tasks")
def create_task(task: TaskCreate):
    db = SessionLocal()
    db_task = TaskModel(title=task.title, description=task.description)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    db.close()
    return {"success": True, "backend": BACKEND_NAME, "data": db_task}

@app.put("/api/tasks/{task_id}")
def update_task(task_id: int, task: TaskUpdate):
    db = SessionLocal()
    db_task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not db_task:
        db.close()
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.title:
        db_task.title = task.title
    if task.description:
        db_task.description = task.description
    if task.status:
        db_task.status = task.status
    
    db.commit()
    db.refresh(db_task)
    db.close()
    return {"success": True, "backend": BACKEND_NAME, "data": db_task}

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int):
    db = SessionLocal()
    db_task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not db_task:
        db.close()
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    db.close()
    return {"success": True, "backend": BACKEND_NAME, "message": "Task deleted successfully"}