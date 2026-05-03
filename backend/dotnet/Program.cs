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
    var client = new AmazonSecretsManagerClient(RegionEndpoint.APSoutheast1);
    var request = new GetSecretValueRequest { SecretId = "task-manager-rds-secrets" };
    var response = await client.GetSecretValueAsync(request);
    var secrets = JsonSerializer.Deserialize<Dictionary<string, string>>(response.SecretString);
    
    if (secrets != null)
    {
        var host = secrets.GetValueOrDefault("DB_HOST", "mysql");
        var user = secrets.GetValueOrDefault("DB_USER", "taskuser");
        var password = secrets.GetValueOrDefault("DB_PASSWORD", "taskpass123");
        var database = secrets.GetValueOrDefault("DB_NAME", "taskdb");
        
        connectionString = $"Server={host};Database={database};User={user};Password={password};";
        Console.WriteLine("Database credentials fetched from AWS Secrets Manager");
        Console.WriteLine($"Using database: {host}/{database}");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Failed to fetch from Secrets Manager: {ex.Message}");
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
}

if (string.IsNullOrEmpty(connectionString))
{
    connectionString = "Server=mysql;Database=taskdb;User=taskuser;Password=taskpass123;";
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
