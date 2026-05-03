package com.taskmanager.config;

import com.amazonaws.services.secretsmanager.AWSSecretsManager;
import com.amazonaws.services.secretsmanager.AWSSecretsManagerClientBuilder;
import com.amazonaws.services.secretsmanager.model.GetSecretValueRequest;
import com.amazonaws.services.secretsmanager.model.GetSecretValueResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SecretsManagerConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(SecretsManagerConfig.class);
    
    @Value("${aws.secretsmanager.secret-name:task-manager-rds-secrets}")
    private String secretName;
    
    @Value("${aws.secretsmanager.region:ap-south-1}")
    private String region;
    
    @PostConstruct
    public void init() {
        try {
            AWSSecretsManager client = AWSSecretsManagerClientBuilder.standard()
                    .withRegion(region)
                    .build();
            
            GetSecretValueRequest request = new GetSecretValueRequest()
                    .withSecretId(secretName);
            GetSecretValueResult response = client.getSecretValue(request);
            
            String secretString = response.getSecretString();
            ObjectMapper mapper = new ObjectMapper();
            JsonNode secrets = mapper.readTree(secretString);
            
            logger.info("Successfully fetched database credentials from AWS Secrets Manager");
            logger.info("DB_HOST: {}", secrets.get("DB_HOST").asText());
            
        } catch (Exception e) {
            logger.error("Failed to fetch secrets from AWS Secrets Manager: {}", e.getMessage());
        }
    }
}
