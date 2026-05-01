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
                
                docker run -d --name task-springboot --network task-network -e SPRING_DATASOURCE_URL=\"jdbc:mysql://${RDS_HOST}:3306/${DB_NAME}?useSSL=false\" -e SPRING_DATASOURCE_USERNAME=${RDS_USER} -e SPRING_DATASOURCE_PASSWORD=${RDS_PASSWORD} -p 8080:8080 ${ECR_REGISTRY}/task-manager-springboot:latest
                
                docker run -d --name task-dotnet --network task-network -e ASPNETCORE_URLS=\"http://+:5000\" -e ConnectionStrings__DefaultConnection=\"Server=${RDS_HOST};Database=${DB_NAME};User=${RDS_USER};Password=${RDS_PASSWORD}\;\" -p 5000:5000 ${ECR_REGISTRY}/task-manager-dotnet:latest
                
                sleep 10
                
                docker run -d --name task-nginx --network task-network -p 80:80 ${ECR_REGISTRY}/task-manager-nginx:latest
                
                echo "Deployment Complete!"
                docker ps
            '
        """
    }
}