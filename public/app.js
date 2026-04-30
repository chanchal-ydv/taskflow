const API_URL = 'http://localhost:3000/api';

// Helper function for smooth page transitions
function navigateWithTransition(url) {
    document.body.classList.add('page-exit');
    setTimeout(() => {
        window.location.href = url;
    }, 400); // Wait for the 0.4s CSS animation to finish
}

if (document.getElementById('loginForm')) {
    document.body.classList.add('login-body');
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('name', data.name);
                // Trigger transition instead of jumping instantly
                navigateWithTransition('dashboard.html');
            } else {
                alert(data.error || "Login failed.");
            }
        } catch (err) {
            alert("Could not connect to server. Is your backend running?");
        }
    });

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('regRole').value;
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });
            if(res.ok) {
                alert('Account created! Please sign in.');
                toggleAuth('login');
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch(err) {
            alert("Could not connect to server.");
        }
    });
}

function toggleAuth(view) {
    document.getElementById('loginCard').style.display = view === 'login' ? 'block' : 'none';
    document.getElementById('registerCard').style.display = view === 'register' ? 'block' : 'none';
}

async function initDashboard() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const userName = localStorage.getItem('name') || 'User';
    
    if (!token) {
        window.location.href = 'index.html'; // No transition if kicked out automatically
        return;
    }

    document.getElementById('welcomeName').innerText = `${userName} (${role})`;
    document.getElementById('navAvatar').innerText = userName.charAt(0).toUpperCase();

    if (role === 'Admin') {
        document.getElementById('navAdmin').style.display = 'flex';
    }
    
    fetchDashboardData();
}

async function fetchDashboardData() {
    const token = localStorage.getItem('token');
    
    try {
        const [projRes, userRes, taskRes] = await Promise.all([
            fetch(`${API_URL}/projects`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const projects = await projRes.json();
        const users = userRes.ok ? await userRes.json() : []; 
        const tasks = await taskRes.json();

        if (localStorage.getItem('role') === 'Admin') {
            document.getElementById('taskProject').innerHTML = '<option value="">Select Project</option>' + projects.map(p => `<option value="${p._id}">${p.name}</option>`).join('');
            document.getElementById('taskUser').innerHTML = '<option value="">Assign To</option>' + users.map(u => `<option value="${u._id}">${u.name}</option>`).join('');
        }

        document.getElementById('statTotalProjects').innerText = projects.length || 0;
        
        const activeTasks = tasks.filter(t => t.status !== 'Completed');
        document.getElementById('statActiveTasks').innerText = activeTasks.length || 0;
        
        const now = new Date();
        const overdueTasks = activeTasks.filter(t => new Date(t.dueDate) < now && t.status !== 'Completed');
        document.getElementById('statOverdueTasks').innerText = overdueTasks.length || 0;
        
        const productivity = tasks.length === 0 ? 0 : Math.round(((tasks.length - activeTasks.length) / tasks.length) * 100);
        document.getElementById('statProductivity').innerText = productivity + '%';

        renderTasks(tasks);
        renderActivity(tasks);
    } catch (err) {
        console.error("Failed to fetch dashboard data.", err);
    }
}

function renderTasks(tasks) {
    const now = new Date();
    
    if (!tasks || tasks.length === 0) {
        document.getElementById('tasksList').innerHTML = '<p style="color:var(--text-muted); padding: 20px 0;">No tasks currently assigned.</p>';
        return;
    }

    document.getElementById('tasksList').innerHTML = tasks.map(t => {
        const isOverdue = new Date(t.dueDate) < now && t.status !== 'Completed';
        const dateColor = isOverdue ? 'color: var(--danger)' : '';
        const dateIcon = isOverdue ? '<i class="fa-solid fa-circle-exclamation"></i> Overdue' : new Date(t.dueDate).toLocaleDateString();
        const assigneeName = t.assignedTo?.name || 'Unassigned';
        const assigneeInitials = assigneeName !== 'Unassigned' ? assigneeName.charAt(0).toUpperCase() : '?';
        const statusClass = `status-${t.status.replace(' ', '-')}`;

        return `
        <div class="task-row">
            <div class="task-main">
                <h4>${t.title}</h4>
                <span class="task-sub"><i class="fa-solid fa-folder-open"></i> ${t.project?.name || 'No Project Assigned'}</span>
            </div>
            
            <div class="task-meta">
                <div class="meta-group">
                    <span class="meta-label">Assignee</span>
                    <span class="meta-value">
                        <div class="avatar" style="width:25px; height:25px; font-size:0.7rem;">${assigneeInitials}</div> 
                        ${assigneeName}
                    </span>
                </div>
                
                <div class="meta-group">
                    <span class="meta-label">Due Date</span>
                    <span class="meta-value" style="${dateColor}">${dateIcon}</span>
                </div>

                <div class="meta-group">
                    <span class="meta-label">Status</span>
                    <select class="status-select ${statusClass}" onchange="updateTask('${t._id}', this.value)">
                        <option value="Pending" ${t.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Completed" ${t.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
            </div>
        </div>
    `}).join('');
}

function renderActivity(tasks) {
    const activityContainer = document.getElementById('recentActivityList');
    
    if (!tasks || tasks.length === 0) {
        activityContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">No recent activity.</p>';
        return;
    }

    const recentTasks = [...tasks].reverse().slice(0, 5);
    
    activityContainer.innerHTML = recentTasks.map(t => {
        const assigneeName = t.assignedTo?.name || 'Unassigned';
        const initials = assigneeName !== 'Unassigned' ? assigneeName.charAt(0).toUpperCase() : '?';
        let statusColor = 'var(--text-muted)';
        if (t.status === 'Completed') statusColor = 'var(--success)';
        if (t.status === 'In Progress') statusColor = 'var(--info)';
        
        return `
        <div class="activity-item" style="margin-bottom: 15px;">
            <div class="avatar" style="width:30px; height:30px; font-size:0.8rem;">${initials}</div>
            <div class="activity-details">
                <p style="font-size: 0.9rem;"><strong>${assigneeName}</strong> was assigned:</p>
                <p style="font-size: 0.85rem; color: var(--text-dark); margin: 3px 0;"><em>${t.title}</em></p>
                <span style="font-size: 0.75rem; color: ${statusColor}; font-weight: 600;">${t.status}</span>
            </div>
        </div>
        `;
    }).join('');
}

async function createProject() {
    const name = document.getElementById('projName').value;
    await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ name })
    });
    document.getElementById('projName').value = '';
    fetchDashboardData();
    switchView('overview', document.getElementById('navOverview')); 
}

async function createTask() {
    const title = document.getElementById('taskTitle').value;
    const project = document.getElementById('taskProject').value;
    const assignedTo = document.getElementById('taskUser').value;
    const dueDate = document.getElementById('taskDate').value;
    await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ title, project, assignedTo, dueDate })
    });
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDate').value = '';
    fetchDashboardData();
    switchView('overview', document.getElementById('navOverview')); 
}

async function updateTask(id, status) {
    try {
        const res = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            body: JSON.stringify({ status })
        });

        if (res.ok) {
            const originalTitle = document.title;
            document.title = "✅ Saved!";
            fetchDashboardData();
            setTimeout(() => { document.title = originalTitle; }, 1500);
        } else {
            alert("Could not update task.");
        }
    } catch (err) {
        alert("Server error. Is your backend running?");
    }
}

function switchView(viewId, element) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    }

    document.querySelectorAll('.view-section').forEach(view => {
        view.style.display = 'none';
    });

    document.getElementById('view-' + viewId).style.display = 'block';
}

function logout() {
    localStorage.clear();
    // Trigger transition on logout
    navigateWithTransition('index.html');
}