using Amazon;
using Amazon.SecretsManager;
using Amazon.SecretsManager.Model;
using System.Text.Json;

namespace TaskManager;

public static class SecretsManagerHelper
{
    private static readonly string SecretName = "task-manager-rds-secrets";
    private static readonly string Region = "ap-south-1";
    
    private static RdsCredentials? _cachedCredentials;
    
    public static async Task<RdsCredentials> GetDatabaseCredentialsAsync()
    {
        if (_cachedCredentials != null)
            return _cachedCredentials;
        
        var client = new AmazonSecretsManagerClient(RegionEndpoint.GetBySystemName(Region));
        var request = new GetSecretValueRequest { SecretId = SecretName };
        
        try
        {
            var response = await client.GetSecretValueAsync(request);
            var secretString = response.SecretString;
            var credentials = JsonSerializer.Deserialize<RdsCredentials>(secretString);
            
            _cachedCredentials = credentials;
            Console.WriteLine("Database credentials fetched from AWS Secrets Manager");
            return credentials;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching secrets: {ex.Message}");
            throw;
        }
    }
}

public class RdsCredentials
{
    public string DB_HOST { get; set; } = string.Empty;
    public string DB_USER { get; set; } = string.Empty;
    public string DB_PASSWORD { get; set; } = string.Empty;
    public string DB_NAME { get; set; } = "taskdb";
    public int DB_PORT { get; set; } = 3306;
}
