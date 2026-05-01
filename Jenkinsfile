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
                    def secretJson = sh(script: "aws secretsmanager get-secret-value --secret-id ${SECRET_NAME} --region ${AWS_REGION} --query SecretString --output text", returnStdout: true).trim()
                    def secrets = new groovy.json.JsonSlurper().parseText(secretJson)
                    
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
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                        
                        cd /home/ubuntu/task-manager
                        
                        # Pull latest images
                        docker-compose -f docker-compose.prod.yml pull 2>/dev/null || true
                        
                        # Stop and remove old containers
                        docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
                        
                        # Start new containers
                        docker-compose -f docker-compose.prod.yml up -d
                        
                        echo "Deployment Complete"
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