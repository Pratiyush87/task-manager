using Microsoft.EntityFrameworkCore;
using TaskManager.Data;
using MySqlConnector;
using Prometheus;
using Amazon;
using Amazon.SecretsManager;
using Amazon.SecretsManager.Model;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Fetch database credentials from AWS Secrets Manager
string? connectionString = null;

try
{
    // Make the client call synchronous since we're not in an async method
    using var client = new AmazonSecretsManagerClient(RegionEndpoint.APSoutheast1);
    var request = new GetSecretValueRequest { SecretId = "task-manager-rds-secrets-3dghPg" };
    var response = client.GetSecretValueAsync(request).GetAwaiter().GetResult();
    var secrets = JsonSerializer.Deserialize<Dictionary<string, string>>(response.SecretString);
    
    if (secrets != null)
    {
        var host = secrets.GetValueOrDefault("DB_HOST", "task-manager-db.cjuk8iq2c0jm.ap-south-1.rds.amazonaws.com");
        var user = secrets.GetValueOrDefault("DB_USER", "admin");
        var password = secrets.GetValueOrDefault("DB_PASSWORD", "Admin123456");
        var database = secrets.GetValueOrDefault("DB_NAME", "taskdb");
        
        connectionString = $"Server={host};Database={database};User={user};Password={password};";
        Console.WriteLine("✅ Database credentials fetched from AWS Secrets Manager");
        Console.WriteLine($"Using database: {host}/{database}");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Failed to fetch from Secrets Manager: {ex.Message}");
    
    // Fallback to environment variables
    var host = Environment.GetEnvironmentVariable("DB_HOST") ?? "task-manager-db.cjuk8iq2c0jm.ap-south-1.rds.amazonaws.com";
    var user = Environment.GetEnvironmentVariable("DB_USER") ?? "admin";
    var password = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "Admin123456";
    var database = Environment.GetEnvironmentVariable("DB_NAME") ?? "taskdb";
    
    connectionString = $"Server={host};Database={database};User={user};Password={password};";
    Console.WriteLine("Using environment variables for database connection");
}

if (string.IsNullOrEmpty(connectionString))
{
    connectionString = "Server=task-manager-db.cjuk8iq2c0jm.ap-south-1.rds.amazonaws.com;Database=taskdb;User=admin;Password=Admin123456;";
    Console.WriteLine("Using hardcoded RDS connection string");
}

Console.WriteLine($"Connecting to: {connectionString.Split(';')[0].Split('=')[1]}");

var serverVersion = new MySqlServerVersion(new Version(8, 0, 0));

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, serverVersion));

var app = builder.Build();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        dbContext.Database.EnsureCreated();
        Console.WriteLine("✅ Database connection successful!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Database connection failed: {ex.Message}");
        throw;
    }
}

// Configure pipeline
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Add Prometheus metrics
app.UseHttpMetrics();
app.MapMetrics();

var backendName = Environment.GetEnvironmentVariable("BACKEND_NAME") ?? ".NET";
Console.WriteLine($".NET backend running - {backendName}");

app.Run();