package com.taskmanager.controller;

import com.taskmanager.model.Task;
import com.taskmanager.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class TaskController {
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Value("${backend.name:SpringBoot}")
    private String backendName;
    
    @GetMapping("/")
    public Map<String, String> root() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "SpringBoot Task Manager");
        response.put("backend", backendName);
        response.put("status", "running");
        return response;
    }
    
    @GetMapping("/health")
    public Map<String, Object> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("backend", backendName);
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return response;
    }
    
    @GetMapping("/tasks")
    public Map<String, Object> getAllTasks() {
        List<Task> tasks = taskRepository.findAll();
        tasks.sort((t1, t2) -> t2.getCreatedAt().compareTo(t1.getCreatedAt()));
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("backend", backendName);
        response.put("data", tasks);
        return response;
    }
    
    @GetMapping("/tasks/{id}")
    public ResponseEntity<Map<String, Object>> getTaskById(@PathVariable Long id) {
        return taskRepository.findById(id)
            .map(task -> {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("backend", backendName);
                response.put("data", task);
                return ResponseEntity.ok(response);
            })
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "error", "Task not found")));
    }
    
    @PostMapping("/tasks")
    public ResponseEntity<Map<String, Object>> createTask(@RequestBody Task task) {
        // Set default status if not provided
        if (task.getStatus() == null || task.getStatus().isEmpty()) {
            task.setStatus("pending");
        }
        Task savedTask = taskRepository.save(task);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("backend", backendName);
        response.put("data", savedTask);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @PutMapping("/tasks/{id}")
    public ResponseEntity<Map<String, Object>> updateTask(@PathVariable Long id, @RequestBody Task taskDetails) {
        return taskRepository.findById(id)
            .map(task -> {
                if (taskDetails.getTitle() != null) task.setTitle(taskDetails.getTitle());
                if (taskDetails.getDescription() != null) task.setDescription(taskDetails.getDescription());
                if (taskDetails.getStatus() != null) task.setStatus(taskDetails.getStatus());
                
                Task updatedTask = taskRepository.save(task);
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("backend", backendName);
                response.put("data", updatedTask);
                return ResponseEntity.ok(response);
            })
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "error", "Task not found")));
    }
    
    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Map<String, Object>> deleteTask(@PathVariable Long id) {
        return taskRepository.findById(id)
            .map(task -> {
                taskRepository.delete(task);
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("backend", backendName);
                response.put("message", "Task deleted successfully");
                return ResponseEntity.ok(response);
            })
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "error", "Task not found")));
    }
}
