pipeline {
    agent any
    
    environment {
        ECR_REGISTRY = '988698481528.dkr.ecr.ap-south-1.amazonaws.com'
        AWS_REGION = 'ap-south-1'
        SECRET_NAME = 'task-manager-rds-secrets'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Fetch Secrets from AWS Secrets Manager') {
            steps {
                script {
                    // Fetch RDS credentials from AWS Secrets Manager
                    def secretJson = sh(script: "aws secretsmanager get-secret-value --secret-id ${SECRET_NAME} --region ${AWS_REGION} --query SecretString --output text", returnStdout: true).trim()
                    def secrets = readJSON text: secretJson
                    
                    // Set environment variables
                    env.RDS_HOST = secrets.DB_HOST
                    env.RDS_USER = secrets.DB_USER
                    env.RDS_PASSWORD = secrets.DB_PASSWORD
                    env.DB_NAME = secrets.DB_NAME
                    
                    echo "✅ Secrets fetched from AWS Secrets Manager"
                }
            }
        }
        
        stage('Login to ECR') {
            steps {
                sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}"
            }
        }
        
        stage('Build and Push Images') {
            parallel {
                stage('Build Node.js') {
                    steps {
                        sh """
                            cd backend/nodejs
                            docker build -t ${ECR_REGISTRY}/task-manager-nodejs:latest .
                            docker push ${ECR_REGISTRY}/task-manager-nodejs:latest
                        """
                    }
                }
                stage('Build FastAPI') {
                    steps {
                        sh """
                            cd backend/fastapi
                            docker build -t ${ECR_REGISTRY}/task-manager-fastapi:latest .
                            docker push ${ECR_REGISTRY}/task-manager-fastapi:latest
                        """
                    }
                }
                stage('Build Spring Boot') {
                    steps {
                        sh """
                            cd backend/springboot
                            docker build -t ${ECR_REGISTRY}/task-manager-springboot:latest .
                            docker push ${ECR_REGISTRY}/task-manager-springboot:latest
                        """
                    }
                }
                stage('Build .NET') {
                    steps {
                        sh """
                            cd backend/dotnet
                            docker build -t ${ECR_REGISTRY}/task-manager-dotnet:latest .
                            docker push ${ECR_REGISTRY}/task-manager-dotnet:latest
                        """
                    }
                }
                stage('Build Nginx') {
                    steps {
                        sh """
                            cd nginx
                            docker build -t ${ECR_REGISTRY}/task-manager-nginx:latest .
                            docker push ${ECR_REGISTRY}/task-manager-nginx:latest
                        """
                    }
                }
            }
        }
        
        stage('Deploy to App Server') {
            steps {
                sh """
                    ssh -o StrictHostKeyChecking=no ubuntu@10.0.2.242 '
                        aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                        
                        cd /home/ubuntu/task-manager
                        
                        # Create docker-compose.prod.yml if not exists
                        cat > docker-compose.prod.yml << 'EOF'
version: \"3.8\"

services:
  nodejs:
    image: ${ECR_REGISTRY}/task-manager-nodejs:latest
    container_name: task-nodejs
    environment:
      - DB_HOST=${RDS_HOST}
      - DB_USER=${RDS_USER}
      - DB_PASSWORD=${RDS_PASSWORD}
      - DB_NAME=${DB_NAME}
      - BACKEND_NAME=Node.js
    ports:
      - \"3001:3001\"
    networks:
      - task-network
    restart: unless-stopped

  fastapi:
    image: ${ECR_REGISTRY}/task-manager-fastapi:latest
    container_name: task-fastapi
    environment:
      - DB_HOST=${RDS_HOST}
      - DB_USER=${RDS_USER}
      - DB_PASSWORD=${RDS_PASSWORD}
      - DB_NAME=${DB_NAME}
      - BACKEND_NAME=FastAPI
    ports:
      - \"8000:8000\"
    networks:
      - task-network
    restart: unless-stopped

  springboot:
    image: ${ECR_REGISTRY}/task-manager-springboot:latest
    container_name: task-springboot
    environment:
      - SPRING_DATASOURCE_URL=jdbc:mysql://${RDS_HOST}:3306/${DB_NAME}?useSSL=false
      - SPRING_DATASOURCE_USERNAME=${RDS_USER}
      - SPRING_DATASOURCE_PASSWORD=${RDS_PASSWORD}
      - BACKEND_NAME=SpringBoot
    ports:
      - \"8080:8080\"
    networks:
      - task-network
    restart: unless-stopped

  dotnet:
    image: ${ECR_REGISTRY}/task-manager-dotnet:latest
    container_name: task-dotnet
    environment:
      - ASPNETCORE_URLS=http://+:5000
      - ConnectionStrings__DefaultConnection=Server=${RDS_HOST};Database=${DB_NAME};User=${RDS_USER};Password=${RDS_PASSWORD};
      - BACKEND_NAME=.NET
    ports:
      - \"5000:5000\"
    networks:
      - task-network
    restart: unless-stopped

  nginx:
    image: ${ECR_REGISTRY}/task-manager-nginx:latest
    container_name: task-nginx
    ports:
      - \"80:80\"
    depends_on:
      - nodejs
      - fastapi
      - springboot
      - dotnet
    networks:
      - task-network
    restart: unless-stopped

networks:
  task-network:
    driver: bridge
EOF
                        
                        # Pull latest images and restart
                        docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
                        docker-compose -f docker-compose.prod.yml pull
                        docker-compose -f docker-compose.prod.yml up -d
                        
                        echo \"Deployment Complete\"
                        docker ps
                    '
                """
            }
        }
    }
    
    post {
        success {
            echo '✅ Deployment successful! Secrets fetched from AWS Secrets Manager'
        }
        failure {
            echo '❌ Deployment failed! Please check the logs.'
        }
    }
}