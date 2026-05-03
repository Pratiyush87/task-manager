const mysql = require('mysql2');
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

// AWS Secrets Manager configuration
const secretsManager = new SecretsManagerClient({ region: 'ap-south-1' });
const SECRET_NAME = 'task-manager-rds-secrets';

let dbConfig = null;

async function getDatabaseConfig() {
    if (dbConfig) return dbConfig;
    
    try {
        const command = new GetSecretValueCommand({ SecretId: SECRET_NAME });
        const response = await secretsManager.send(command);
        const secrets = JSON.parse(response.SecretString);
        
        dbConfig = {
            host: secrets.DB_HOST,
            user: secrets.DB_USER,
            password: secrets.DB_PASSWORD,
            database: secrets.DB_NAME || 'taskdb',
            port: secrets.DB_PORT || 3306
        };
        
        console.log('Database credentials fetched from AWS Secrets Manager');
        return dbConfig;
    } catch (error) {
        console.error('Error fetching secrets from AWS Secrets Manager:', error);
        // Fallback to environment variables for local development
        return {
            host: process.env.DB_HOST || 'mysql',
            user: process.env.DB_USER || 'taskuser',
            password: process.env.DB_PASSWORD || 'taskpass123',
            database: process.env.DB_NAME || 'taskdb',
            port: process.env.DB_PORT || 3306
        };
    }
}

let pool = null;
let promisePool = null;

async function getConnection() {
    if (pool && promisePool) return { pool, promisePool };
    
    const config = await getDatabaseConfig();
    
    pool = mysql.createPool({
        host: config.host,
        user: config.user,
        password: config.password,
        database: config.database,
        port: config.port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
    
    promisePool = pool.promise();
    return { pool, promisePool };
}

const createTable = async () => {
    const { promisePool } = await getConnection();
    
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
    
    try {
        await promisePool.query(createTableQuery);
        console.log('Tasks table created or already exists');
    } catch (error) {
        console.error('Error creating table:', error);
    }
};

// Initialize connection and create table
getConnection().then(() => createTable());

module.exports = async () => {
    const { promisePool } = await getConnection();
    return promisePool;
};