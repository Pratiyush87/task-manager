using Microsoft.EntityFrameworkCore;
using TaskManager.Data;
using MySqlConnector;
using Prometheus;

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

// Fetch database credentials from AWS Secrets Manager before building the app
RdsCredentials? dbCredentials = null;
try
{
    dbCredentials = await SecretsManagerHelper.GetDatabaseCredentialsAsync();
    Console.WriteLine("Successfully fetched credentials from AWS Secrets Manager");
}
catch (Exception ex)
{
    Console.WriteLine($"Failed to fetch from Secrets Manager: {ex.Message}");
    Console.WriteLine("Falling back to connection string from configuration");
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
