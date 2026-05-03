using Microsoft.EntityFrameworkCore;
using TaskManager.Data;
using MySqlConnector;
using Prometheus;
using Amazon;
using Amazon.SecretsManager;
using Amazon.SecretsManager.Model;
using System.Text.Json;

namespace TaskManager;

public class RdsCredentials
{
    public string DB_HOST { get; set; } = string.Empty;
    public string DB_USER { get; set; } = string.Empty;
    public string DB_PASSWORD { get; set; } = string.Empty;
    public string DB_NAME { get; set; } = "taskdb";
    public int DB_PORT { get; set; } = 3306;
}

public static class SecretsManagerHelper
{
    private static readonly string SecretName = "task-manager-rds-secrets";
    private static readonly string Region = "ap-south-1";
    
    private static RdsCredentials? _cachedCredentials;
    
    public static async Task<RdsCredentials?> GetDatabaseCredentialsAsync()
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
            return null;
        }
    }
}

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

// Fetch database credentials from AWS Secrets Manager
RdsCredentials? dbCredentials = null;
try
{
    dbCredentials = await SecretsManagerHelper.GetDatabaseCredentialsAsync();
    if (dbCredentials != null)
    {
        Console.WriteLine("Successfully fetched credentials from AWS Secrets Manager");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Failed to fetch from Secrets Manager: {ex.Message}");
}

// Configure MySQL Database connection string
string connectionString;
if (dbCredentials != null)
{
    connectionString = $"Server={dbCredentials.DB_HOST};Database={dbCredentials.DB_NAME};User={dbCredentials.DB_USER};Password={dbCredentials.DB_PASSWORD};";
    Console.WriteLine($"Using database: {dbCredentials.DB_HOST}:{dbCredentials.DB_PORT}/{dbCredentials.DB_NAME}");
}
else
{
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? "Server=mysql;Database=taskdb;User=taskuser;Password=taskpass123;";
    Console.WriteLine("Using fallback connection string");
}

var serverVersion = new MySqlServerVersion(new Version(8, 0, 0));

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, serverVersion));

var app = builder.Build();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.EnsureCreated();
}

// Configure pipeline
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Add Prometheus metrics
app.UseHttpMetrics();
app.MapMetrics();

var backendName = app.Configuration["BackendName"] ?? ".NET";
Console.WriteLine($".NET backend running - {backendName}");

app.Run();
