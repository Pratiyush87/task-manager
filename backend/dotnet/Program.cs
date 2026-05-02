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

// Configure MySQL Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
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