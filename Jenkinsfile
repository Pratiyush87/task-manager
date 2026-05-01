pipeline {
    agent any
    
    environment {
        ECR_REGISTRY = '988698481528.dkr.ecr.ap-south-1.amazonaws.com'
        AWS_REGION = 'ap-south-1'
        RDS_HOST = credentials('rds-host')
        RDS_USER = credentials('rds-username')
        RDS_PASSWORD = credentials('rds-password')
        DB_NAME = 'taskdb'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
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
                        
                        docker pull ${ECR_REGISTRY}/task-manager-nodejs:latest
                        docker pull ${ECR_REGISTRY}/task-manager-fastapi:latest
                        docker pull ${ECR_REGISTRY}/task-manager-springboot:latest
                        docker pull ${ECR_REGISTRY}/task-manager-dotnet:latest
                        docker pull ${ECR_REGISTRY}/task-manager-nginx:latest
                        
                        docker stop task-nodejs task-fastapi task-springboot task-dotnet task-nginx 2>/dev/null || true
                        docker rm task-nodejs task-fastapi task-springboot task-dotnet task-nginx 2>/dev/null || true
                        
                        docker network create task-network 2>/dev/null || true
                        
                        docker run -d --name task-nodejs --network task-network -e DB_HOST=${RDS_HOST} -e DB_USER=${RDS_USER} -e DB_PASSWORD=${RDS_PASSWORD} -e DB_NAME=${DB_NAME} -p 3001:3001 ${ECR_REGISTRY}/task-manager-nodejs:latest
                        
                        docker run -d --name task-fastapi --network task-network -e DB_HOST=${RDS_HOST} -e DB_USER=${RDS_USER} -e DB_PASSWORD=${RDS_PASSWORD} -e DB_NAME=${DB_NAME} -p 8000:8000 ${ECR_REGISTRY}/task-manager-fastapi:latest
                        
                        docker run -d --name task-springboot --network task-network -e SPRING_DATASOURCE_URL=jdbc:mysql://${RDS_HOST}:3306/${DB_NAME}?useSSL=false -e SPRING_DATASOURCE_USERNAME=${RDS_USER} -e SPRING_DATASOURCE_PASSWORD=${RDS_PASSWORD} -p 8080:8080 ${ECR_REGISTRY}/task-manager-springboot:latest
                        
                        docker run -d --name task-dotnet --network task-network -e ASPNETCORE_URLS=http://+:5000 -e ConnectionStrings__DefaultConnection=Server=${RDS_HOST};Database=${DB_NAME};User=${RDS_USER};Password=${RDS_PASSWORD}; -p 5000:5000 ${ECR_REGISTRY}/task-manager-dotnet:latest
                        
                        sleep 10
                        
                        docker run -d --name task-nginx --network task-network -p 80:80 ${ECR_REGISTRY}/task-manager-nginx:latest
                        
                        echo Deployment Complete
                        docker ps
                    '
                """
            }
        }
    }
    
    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed! Please check the logs.'
        }
    }
}