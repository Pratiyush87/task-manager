from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import json
import boto3
from botocore.exceptions import ClientError

# AWS Secrets Manager configuration
SECRET_NAME = "task-manager-rds-secrets"
REGION = "ap-south-1"

def get_db_config():
    try:
        session = boto3.session.Session()
        client = session.client(service_name='secretsmanager', region_name=REGION)
        response = client.get_secret_value(SecretId=SECRET_NAME)
        secrets = json.loads(response['SecretString'])
        
        db_config = {
            'host': secrets['DB_HOST'],
            'user': secrets['DB_USER'],
            'password': secrets['DB_PASSWORD'],
            'database': secrets.get('DB_NAME', 'taskdb'),
            'port': secrets.get('DB_PORT', 3306)
        }
        print("Database credentials fetched from AWS Secrets Manager")
        return db_config
    except ClientError as e:
        print(f"Error fetching secrets: {e}")
        # Fallback to environment variables for local development
        return {
            'host': os.getenv('DB_HOST', 'mysql'),
            'user': os.getenv('DB_USER', 'taskuser'),
            'password': os.getenv('DB_PASSWORD', 'taskpass123'),
            'database': os.getenv('DB_NAME', 'taskdb'),
            'port': os.getenv('DB_PORT', 3306)
        }

# Get database configuration
db_config = get_db_config()

DATABASE_URL = f"mysql+pymysql://{db_config['user']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['database']}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()