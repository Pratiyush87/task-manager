import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:80/api';

function App() {
    const [selectedBackend, setSelectedBackend] = useState('nodejs');
    const [backends, setBackends] = useState([
        { id: 'nodejs', name: 'Node.js', tech: 'JavaScript', status: 'unknown' },
        { id: 'fastapi', name: 'FastAPI', tech: 'Python', status: 'unknown' },
        { id: 'springboot', name: 'Spring Boot', tech: 'Java', status: 'unknown' },
        { id: 'dotnet', name: '.NET', tech: 'C#', status: 'unknown' }
    ]);
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    // State for editing
    const [editingTask, setEditingTask] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editStatus, setEditStatus] = useState('');

    // Check health of all backends
    const checkHealth = async () => {
        const updated = [...backends];
        for (let i = 0; i < updated.length; i++) {
            try {
                const res = await fetch(`${API_BASE}/${updated[i].id}/health`);
                updated[i].status = res.ok ? 'online' : 'offline';
            } catch {
                updated[i].status = 'offline';
            }
        }
        setBackends(updated);
    };

    // Fetch tasks
    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/${selectedBackend}/tasks`);
            const data = await res.json();
            if (data.success) {
                setTasks(data.data);
                setMessage(`Connected to ${data.backend}`);
            }
        } catch (error) {
            setMessage(`Error: Cannot connect to ${selectedBackend}`);
        }
        setLoading(false);
    };

    // Select backend
    const selectBackend = (id) => {
        if (backends.find(b => b.id === id)?.status === 'online') {
            setSelectedBackend(id);
            setEditingTask(null); // Reset editing when switching backend
            fetchTasks();
        } else {
            setMessage(`${id} is offline`);
        }
    };

    // Add task
    const addTask = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        
        try {
            const res = await fetch(`${API_BASE}/${selectedBackend}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description })
            });
            const data = await res.json();
            if (data.success) {
                setMessage('Task added!');
                setTitle('');
                setDescription('');
                fetchTasks();
            }
        } catch (error) {
            setMessage('Error adding task');
        }
    };

    // Start editing a task
    const startEdit = (task) => {
        setEditingTask(task);
        setEditTitle(task.title || '');
        setEditDescription(task.description || '');
        setEditStatus(task.status || 'pending');
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditingTask(null);
        setEditTitle('');
        setEditDescription('');
        setEditStatus('');
    };

    // Update task
    const updateTask = async (id) => {
        if (!editTitle.trim()) {
            setMessage('Title cannot be empty');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/${selectedBackend}/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title: editTitle, 
                    description: editDescription,
                    status: editStatus 
                })
            });
            const data = await res.json();
            if (data.success) {
                setMessage('Task updated!');
                cancelEdit();
                fetchTasks();
            } else {
                setMessage('Error updating task');
            }
        } catch (error) {
            setMessage('Error updating task');
        }
    };

    // Delete task
    const deleteTask = async (id) => {
        if (window.confirm('Delete this task?')) {
            try {
                const res = await fetch(`${API_BASE}/${selectedBackend}/tasks/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    setMessage('Task deleted!');
                    fetchTasks();
                }
            } catch (error) {
                setMessage('Error deleting task');
            }
        }
    };

    useEffect(() => {
        checkHealth();
        fetchTasks();
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, [selectedBackend]);

    // Card styles based on selection
    const getCardStyle = (backendId, status) => {
        let borderStyle = '2px solid #ddd';
        let backgroundStyle = 'white';
        
        if (selectedBackend === backendId && status === 'online') {
            borderStyle = '3px solid #667eea';
            backgroundStyle = '#f0f4ff';
            
            if (backendId === 'nodejs') borderStyle = '3px solid #68a063';
            if (backendId === 'fastapi') borderStyle = '3px solid #009688';
            if (backendId === 'springboot') borderStyle = '3px solid #6db33f';
            if (backendId === 'dotnet') borderStyle = '3px solid #512bd4';
        }
        
        return {
            border: borderStyle,
            background: backgroundStyle,
            borderRadius: '10px',
            padding: '15px',
            cursor: status === 'online' ? 'pointer' : 'not-allowed',
            opacity: status === 'online' ? 1 : 0.5,
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        };
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '20px',
                borderRadius: '10px',
                marginBottom: '20px',
                textAlign: 'center'
            }}>
                <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>Multi-Backend Task Manager</h1>
                <p style={{ fontSize: '12px' }}>React → Nginx → Node.js | FastAPI | Spring Boot | .NET → MySQL</p>
            </div>

            {/* Message */}
            {message && (
                <div style={{
                    background: '#d4edda',
                    color: '#155724',
                    padding: '10px',
                    borderRadius: '5px',
                    marginBottom: '15px',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <span>{message}</span>
                    <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>×</button>
                </div>
            )}

            {/* Backend Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                marginBottom: '20px'
            }}>
                {backends.map(backend => (
                    <div
                        key={backend.id}
                        style={getCardStyle(backend.id, backend.status)}
                        onClick={() => selectBackend(backend.id)}
                    >
                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px' }}>
                            {backend.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                            {backend.tech}
                        </div>
                        <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background: backend.status === 'online' ? '#4caf50' : '#f44336',
                            color: 'white'
                        }}>
                            {backend.status === 'online' ? 'Online' : 'Offline'}
                        </span>
                        {selectedBackend === backend.id && backend.status === 'online' && (
                            <div style={{
                                background: '#ff9800',
                                color: 'white',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                marginTop: '8px',
                                display: 'inline-block',
                                marginLeft: '8px'
                            }}>
                                Active
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Load Balancer Info */}
            <div style={{
                background: '#667eea',
                color: 'white',
                padding: '10px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center',
                fontSize: '13px'
            }}>
                Active: {backends.find(b => b.id === selectedBackend)?.name} via Nginx Load Balancer
            </div>

            {/* Add Task Form */}
            <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                marginBottom: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ marginBottom: '15px' }}>Add New Task</h3>
                <form onSubmit={addTask}>
                    <input
                        type="text"
                        placeholder="Task Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                        required
                    />
                    <textarea
                        placeholder="Task Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="3"
                        style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                    />
                    <button type="submit" style={{ background: '#667eea', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
                        Add Task
                    </button>
                </form>
            </div>

            {/* Tasks Table */}
            <div style={{
                background: 'white',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#667eea', color: 'white' }}>
                            <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Title</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Created At</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                        ) : tasks.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No tasks found</td></tr>
                        ) : (
                            tasks.map(task => (
                                editingTask?.id === task.id ? (
                                    // Edit mode row
                                    <tr key={task.id} style={{ background: '#fff3e0' }}>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{task.id}</td>
                                        <td colSpan="5" style={{ padding: '12px' }}>
                                            <div>
                                                <input
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                    placeholder="Title"
                                                />
                                                <textarea
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    rows="2"
                                    style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                    placeholder="Description"
                                                />
                                                <select
                                                    value={editStatus}
                                                    onChange={(e) => setEditStatus(e.target.value)}
                                                    style={{ padding: '8px', marginRight: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="completed">Completed</option>
                                                </select>
                                                <button 
                                                    onClick={() => updateTask(task.id)} 
                                                    style={{ background: '#4caf50', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}
                                                >
                                                    Save
                                                </button>
                                                <button 
                                                    onClick={cancelEdit} 
                                                    style={{ background: '#999', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    // Normal view mode row
                                    <tr key={task.id}>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{task.id}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}><strong>{task.title}</strong></td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{task.description || '-'}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                                            <span style={{
                                                background: task.status === 'completed' ? '#4caf50' : '#ff9800',
                                                color: 'white',
                                                padding: '3px 8px',
                                                borderRadius: '3px',
                                                fontSize: '11px',
                                                fontWeight: 'bold'
                                            }}>
                                                {task.status || 'pending'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontSize: '12px' }}>
                                            {new Date(task.created_at || task.createdAt).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                                            <button 
                                                onClick={() => startEdit(task)} 
                                                style={{ background: '#ff9800', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => deleteTask(task.id)} 
                                                style={{ background: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                )
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default App;