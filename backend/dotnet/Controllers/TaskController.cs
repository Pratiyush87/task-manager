using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManager.Data;
using TaskManager.Models;

namespace TaskManager.Controllers;

[ApiController]
[Route("api")]
public class TaskController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public TaskController(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    private string GetBackendName()
    {
        return _configuration["BACKEND_NAME"] ?? ".NET";
    }

    [HttpGet("/")]
    public IActionResult Root()
    {
        return Ok(new { 
            message = ".NET Task Manager", 
            backend = GetBackendName(), 
            status = "running" 
        });
    }

    [HttpGet("health")]
    public IActionResult HealthCheck()
    {
        return Ok(new { 
            status = "healthy", 
            backend = GetBackendName(), 
            timestamp = DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ssZ") 
        });
    }

    [HttpGet("tasks")]
    public async Task<IActionResult> GetAllTasks()
    {
        var tasks = await _context.Tasks
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
        
        return Ok(new { 
            success = true, 
            backend = GetBackendName(), 
            data = tasks 
        });
    }

    [HttpGet("tasks/{id}")]
    public async Task<IActionResult> GetTaskById(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        
        if (task == null)
            return NotFound(new { success = false, error = "Task not found" });
        
        return Ok(new { 
            success = true, 
            backend = GetBackendName(), 
            data = task 
        });
    }

    [HttpPost("tasks")]
    public async Task<IActionResult> CreateTask([FromBody] TaskItem taskItem)
    {
        if (string.IsNullOrEmpty(taskItem.Title))
            return BadRequest(new { success = false, error = "Title is required" });
        
        taskItem.CreatedAt = DateTime.Now;
        taskItem.Status = "pending";
        
        _context.Tasks.Add(taskItem);
        await _context.SaveChangesAsync();
        
        return CreatedAtAction(nameof(GetTaskById), new { id = taskItem.Id }, new { 
            success = true, 
            backend = GetBackendName(), 
            data = taskItem 
        });
    }

    [HttpPut("tasks/{id}")]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskItem taskUpdate)
    {
        var task = await _context.Tasks.FindAsync(id);
        
        if (task == null)
            return NotFound(new { success = false, error = "Task not found" });
        
        if (!string.IsNullOrEmpty(taskUpdate.Title))
            task.Title = taskUpdate.Title;
        
        if (!string.IsNullOrEmpty(taskUpdate.Description))
            task.Description = taskUpdate.Description;
        
        if (!string.IsNullOrEmpty(taskUpdate.Status))
            task.Status = taskUpdate.Status;
        
        task.UpdatedAt = DateTime.Now;
        
        await _context.SaveChangesAsync();
        
        return Ok(new { 
            success = true, 
            backend = GetBackendName(), 
            data = task 
        });
    }

    [HttpDelete("tasks/{id}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        
        if (task == null)
            return NotFound(new { success = false, error = "Task not found" });
        
        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
        
        return Ok(new { 
            success = true, 
            backend = GetBackendName(), 
            message = "Task deleted successfully" 
        });
    }
}
