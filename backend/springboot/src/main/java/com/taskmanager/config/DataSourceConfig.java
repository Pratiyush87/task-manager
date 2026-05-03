package com.taskmanager.config;

import com.amazonaws.services.secretsmanager.AWSSecretsManager;
import com.amazonaws.services.secretsmanager.AWSSecretsManagerClientBuilder;
import com.amazonaws.services.secretsmanager.model.GetSecretValueRequest;
import com.amazonaws.services.secretsmanager.model.GetSecretValueResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.jdbc.DataSourceBuilder;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(DataSourceConfig.class);
    
    @Bean
    public DataSource dataSource() {
        try {
            AWSSecretsManager client = AWSSecretsManagerClientBuilder.standard()
                    .withRegion("ap-south-1")
                    .build();
            
            GetSecretValueRequest request = new GetSecretValueRequest()
                    .withSecretId("task-manager-rds-secrets");
            GetSecretValueResult response = client.getSecretValue(request);
            
            String secretString = response.getSecretString();
            ObjectMapper mapper = new ObjectMapper();
            JsonNode secrets = mapper.readTree(secretString);
            
            String host = secrets.get("DB_HOST").asText();
            String user = secrets.get("DB_USER").asText();
            String password = secrets.get("DB_PASSWORD").asText();
            String database = secrets.get("DB_NAME").asText();
            
            logger.info("Database credentials fetched from AWS Secrets Manager");
            logger.info("Connecting to database: {}@{}:3306/{}", user, host, database);
            
            return DataSourceBuilder.create()
                    .driverClassName("com.mysql.cj.jdbc.Driver")
                    .url(String.format("jdbc:mysql://%s:3306/%s?useSSL=false&allowPublicKeyRetrieval=true", host, database))
                    .username(user)
                    .password(password)
                    .build();
                    
        } catch (Exception e) {
            logger.error("Failed to fetch secrets from AWS Secrets Manager: {}", e.getMessage());
            throw new RuntimeException("Could not configure DataSource", e);
        }
    }
}
