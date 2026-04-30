from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import pathlib

# Load env from parent directory
env_path = pathlib.Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

DB_HOST = os.getenv('DB_HOST', 'mysql')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_NAME = os.getenv('DB_NAME', 'taskdb')
DB_USER = os.getenv('DB_USER', 'taskuser')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'taskpass123')

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
