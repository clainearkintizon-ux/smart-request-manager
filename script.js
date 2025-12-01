let users = JSON.parse(localStorage.getItem('users')) || [
    { username: 'admin', password: 'admin', email: 'admin@system.com', role: 'admin' },
    { username: 'user', password: 'user', email: 'user@system.com', role: 'user' }
];
let requests = JSON.parse(localStorage.getItem('requests')) || [];
let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
let currentUser = null;
let currentRole = null;
let requestId = JSON.parse(localStorage.getItem('requestId')) || 1;
let currentEditId = null;
let currentCommentReqId = null;
let emailConfig = JSON.parse(localStorage.getItem('emailConfig')) || null;
let charts = {};
let adminUsers = users.filter(u => u.role === 'admin');

localStorage.setItem('users', JSON.stringify(users));

if (emailConfig) {
    emailjs.init(emailConfig.publicKey);
}

const darkMode = localStorage.getItem('darkMode') === 'true';
if (darkMode) {
    document.body.classList.add('dark-mode');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    
    document.querySelectorAll('.btn-theme').forEach(btn => {
        btn.textContent = isDark ? '☀️' : '🌙';
    });
    
    if (charts.category) updateCharts();
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('registerForm').classList.add('active');
    }
}

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = username;
        currentRole = user.role;
        showPage(user.role === 'admin' ? 'adminPage' : 'userPage');
        if (user.role === 'admin') {
            loadAdminDashboard();
        } else {
            loadUserDashboard();
        }
    } else {
        alert('Invalid credentials');
    }
});

document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;

    if (users.find(u => u.username === username)) {
        alert('Username already exists');
        return;
    }

    users.push({ username, email, password, role });
    localStorage.setItem('users', JSON.stringify(users));
    alert('Account created! Please login.');
    document.getElementById('registerForm').reset();
    switchTab('login');
});

function logout() {
    currentUser = null;
    currentRole = null;
    showPage('homePage');
}

document.getElementById('trackForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('trackId').value);
    const req = requests.find(r => r.id === id);

    document.getElementById('trackResult').classList.add('hidden');
    document.getElementById('trackError').classList.add('hidden');

    if (req) {
        document.getElementById('resultId').textContent = req.id;
        document.getElementById('resultTitle').textContent = req.title;
        document.getElementById('resultCategory').textContent = req.category;
        document.getElementById('resultStatus').textContent = req.status;
        document.getElementById('resultDate').textContent = new Date(req.date).toLocaleDateString();
        document.getElementById('resultNotes').textContent = req.note || 'No notes';
        document.getElementById('trackResult').classList.remove('hidden');
    } else {
        document.getElementById('trackError').classList.remove('hidden');
    }
});

function showAdminSection(section) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    if (section === 'dashboard') {
        document.getElementById('adminDashboard').classList.add('active');
    } else {
        document.getElementById('adminAnalytics').classList.add('active');
        updateAnalytics();
    }
}

function showUserSection(section) {
    document.querySelectorAll('.user-section').forEach(s => s.classList.remove('active'));
    if (section === 'submit') {
        document.getElementById('userSubmit').classList.add('active');
    } else {
        document.getElementById('userMyRequests').classList.add('active');
        updateUserStats();
        renderUserTable();
    }
}

document.getElementById('userSearch').addEventListener('input', renderUserTable);
document.getElementById('userStatusFilter').addEventListener('change', renderUserTable);

function loadAdminDashboard() {
    showAdminSection('dashboard');
    updateAdminStats();
    renderAdminTable();
    setupAdminFilters();
    updateNotificationCount();
}

function loadUserDashboard() {
    showUserSection('submit');
    updateNotificationCount();
}

function updateAdminStats() {
    document.getElementById('totalReqs').textContent = requests.length;
    document.getElementById('pendingReqs').textContent = requests.filter(r => r.status === 'Pending').length;
    document.getElementById('inProgressReqs').textContent = requests.filter(r => r.status === 'In Progress').length;
    document.getElementById('completedReqs').textContent = requests.filter(r => r.status === 'Completed').length;
}

function renderAdminTable(filtered = requests) {
    const tbody = document.getElementById('adminTable');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No requests found</td></tr>';
        return;
    }

    filtered.forEach(req => {
        const dueDate = req.dueDate ? new Date(req.dueDate).toLocaleDateString() : 'N/A';
        const assignedTo = req.assignedTo || 'Unassigned';
        tbody.innerHTML += `
            <tr>
                <td>${req.id}</td>
                <td>${req.user}</td>
                <td>${req.title}</td>
                <td>${req.category}</td>
                <td><span class="status-badge priority-${req.priority.toLowerCase()}">${req.priority}</span></td>
                <td><span class="status-badge status-${req.status.toLowerCase().replace(' ', '-')}">${req.status}</span></td>
                <td>${dueDate}</td>
                <td>${assignedTo}</td>
                <td><button class="action-btn" onclick="openStatusModal(${req.id})">Update</button></td>
            </tr>
        `;
    });
}

function setupAdminFilters() {
    document.getElementById('adminSearch').addEventListener('input', filterAdminTable);
    document.getElementById('adminCategoryFilter').addEventListener('change', filterAdminTable);
    document.getElementById('adminStatusFilter').addEventListener('change', filterAdminTable);
}

function filterAdminTable() {
    const search = document.getElementById('adminSearch').value.toLowerCase();
    const category = document.getElementById('adminCategoryFilter').value;
    const status = document.getElementById('adminStatusFilter').value;

    const filtered = requests.filter(req => {
        const matchSearch = req.title.toLowerCase().includes(search) || req.user.toLowerCase().includes(search);
        const matchCategory = !category || req.category === category;
        const matchStatus = !status || req.status === status;
        return matchSearch && matchCategory && matchStatus;
    });

    renderAdminTable(filtered);
}

function updateAnalytics() {
    updateCharts();
}

function updateCharts() {
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#e0e0e0' : '#333';
    const gridColor = isDark ? '#444' : '#ddd';
    
    const bugCount = requests.filter(r => r.category === 'Bug').length;
    const featureCount = requests.filter(r => r.category === 'Feature').length;
    const supportCount = requests.filter(r => r.category === 'Support').length;
    const otherCount = requests.filter(r => r.category === 'Other').length;
    
    const pendingCount = requests.filter(r => r.status === 'Pending').length;
    const progressCount = requests.filter(r => r.status === 'In Progress').length;
    const completedCount = requests.filter(r => r.status === 'Completed').length;
    
    const lowCount = requests.filter(r => r.priority === 'Low').length;
    const mediumCount = requests.filter(r => r.priority === 'Medium').length;
    const highCount = requests.filter(r => r.priority === 'High').length;
    
    if (charts.category) charts.category.destroy();
    if (charts.status) charts.status.destroy();
    if (charts.priority) charts.priority.destroy();
    if (charts.trend) charts.trend.destroy();
    
    charts.category = new Chart(document.getElementById('categoryChart'), {
        type: 'doughnut',
        data: {
            labels: ['Bug', 'Feature', 'Support', 'Other'],
            datasets: [{
                data: [bugCount, featureCount, supportCount, otherCount],
                backgroundColor: ['#e74c3c', '#3498db', '#2ecc71', '#95a5a6']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: textColor } }
            }
        }
    });
    
    charts.status = new Chart(document.getElementById('statusChart'), {
        type: 'pie',
        data: {
            labels: ['Pending', 'In Progress', 'Completed'],
            datasets: [{
                data: [pendingCount, progressCount, completedCount],
                backgroundColor: ['#f39c12', '#3498db', '#2ecc71']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: textColor } }
            }
        }
    });
    
    charts.priority = new Chart(document.getElementById('priorityChart'), {
        type: 'bar',
        data: {
            labels: ['Low', 'Medium', 'High'],
            datasets: [{
                label: 'Requests',
                data: [lowCount, mediumCount, highCount],
                backgroundColor: ['#2ecc71', '#f39c12', '#e74c3c']
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: { labels: { color: textColor } }
            }
        }
    });
    
    const last7Days = [];
    const requestCounts = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString();
        last7Days.push(dateStr);
        const count = requests.filter(r => new Date(r.date).toLocaleDateString() === dateStr).length;
        requestCounts.push(count);
    }
    
    charts.trend = new Chart(document.getElementById('trendChart'), {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'Requests',
                data: requestCounts,
                borderColor: '#4A90E2',
                backgroundColor: 'rgba(74, 144, 226, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: { labels: { color: textColor } }
            }
        }
    });
}

function loadUserDashboard() {
    showUserSection('submit');
}

function updateUserStats() {
    const userReqs = requests.filter(r => r.user === currentUser);
    document.getElementById('userTotal').textContent = userReqs.length;
    document.getElementById('userPending').textContent = userReqs.filter(r => r.status === 'Pending').length;
    document.getElementById('userCompleted').textContent = userReqs.filter(r => r.status === 'Completed').length;
}

function renderUserTable() {
    const search = document.getElementById('userSearch').value.toLowerCase();
    const status = document.getElementById('userStatusFilter').value;
    const userReqs = requests.filter(r => r.user === currentUser);
    
    const filtered = userReqs.filter(req => {
        const matchSearch = !search || req.title.toLowerCase().includes(search);
        const matchStatus = !status || req.status === status;
        return matchSearch && matchStatus;
    });
    
    const tbody = document.getElementById('userTable');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No requests found</td></tr>';
        return;
    }

    filtered.forEach(req => {
        const dueDate = req.dueDate ? new Date(req.dueDate).toLocaleDateString() : 'N/A';
        const commentCount = req.comments ? req.comments.length : 0;
        tbody.innerHTML += `
            <tr>
                <td>${req.id}</td>
                <td>${req.title}</td>
                <td>${req.category}</td>
                <td><span class="status-badge priority-${req.priority.toLowerCase()}">${req.priority}</span></td>
                <td><span class="status-badge status-${req.status.toLowerCase().replace(' ', '-')}">${req.status}</span></td>
                <td>${dueDate}</td>
                <td><button class="action-btn" onclick="openComments(${req.id})">💬 ${commentCount}</button></td>
            </tr>
        `;
    });
}

document.getElementById('requestForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('reqTitle').value;
    const newRequest = {
        id: requestId++,
        user: currentUser,
        title: title,
        description: document.getElementById('reqDescription').value,
        department: document.getElementById('reqDepartment').value || 'N/A',
        priority: document.getElementById('reqPriority').value,
        category: autoCategorize(title),
        status: 'Pending',
        date: new Date().toISOString(),
        dueDate: document.getElementById('reqDueDate').value || null,
        assignedTo: null,
        comments: [],
        note: ''
    };

    requests.push(newRequest);
    localStorage.setItem('requests', JSON.stringify(requests));
    localStorage.setItem('requestId', JSON.stringify(requestId));

    createNotification('admin', `New request #${newRequest.id} from ${currentUser}`, newRequest.id);

    alert(`Request submitted! Your Request ID is: ${newRequest.id}`);
    document.getElementById('requestForm').reset();
    
    showUserSection('myRequests');
});

function autoCategorize(title) {
    const lower = title.toLowerCase();
    if (lower.includes('bug') || lower.includes('error') || lower.includes('issue')) return 'Bug';
    if (lower.includes('feature') || lower.includes('add') || lower.includes('new')) return 'Feature';
    if (lower.includes('help') || lower.includes('support') || lower.includes('question')) return 'Support';
    return 'Other';
}

function openStatusModal(id) {
    currentEditId = id;
    const req = requests.find(r => r.id === id);
    document.getElementById('newStatus').value = req.status;
    document.getElementById('statusNote').value = req.note || '';
    document.getElementById('statusModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('statusModal').classList.add('hidden');
}

function updateStatus() {
    const req = requests.find(r => r.id === currentEditId);
    const oldStatus = req.status;
    const newStatus = document.getElementById('newStatus').value;
    req.status = newStatus;
    req.note = document.getElementById('statusNote').value;

    localStorage.setItem('requests', JSON.stringify(requests));
    
    if (newStatus === 'Completed' && oldStatus !== 'Completed') {
        sendEmailNotification(req);
    }
    
    closeModal();
    updateAdminStats();
    renderAdminTable();
    alert('Status updated!');
}

function sendEmailNotification(req) {
    if (!emailConfig) {
        console.log('Email not configured');
        return;
    }
    
    const user = users.find(u => u.username === req.user);
    if (!user || !user.email) {
        console.log('User email not found');
        return;
    }
    
    const templateParams = {
        to_email: user.email,
        to_name: user.username,
        request_id: req.id,
        request_title: req.title,
        request_status: req.status,
        admin_note: req.note || 'No additional notes'
    };
    
    emailjs.send(emailConfig.serviceId, emailConfig.templateId, templateParams)
        .then(() => {
            console.log('Email sent successfully');
        })
        .catch((error) => {
            console.error('Email failed:', error);
        });
}

function openEmailSetup() {
    if (emailConfig) {
        document.getElementById('emailServiceId').value = emailConfig.serviceId;
        document.getElementById('emailTemplateId').value = emailConfig.templateId;
        document.getElementById('emailPublicKey').value = emailConfig.publicKey;
    }
    document.getElementById('emailSetupModal').classList.remove('hidden');
}

function closeEmailSetup() {
    document.getElementById('emailSetupModal').classList.add('hidden');
}

function saveEmailConfig() {
    const serviceId = document.getElementById('emailServiceId').value;
    const templateId = document.getElementById('emailTemplateId').value;
    const publicKey = document.getElementById('emailPublicKey').value;
    
    if (!serviceId || !templateId || !publicKey) {
        alert('Please fill all fields');
        return;
    }
    
    emailConfig = { serviceId, templateId, publicKey };
    localStorage.setItem('emailConfig', JSON.stringify(emailConfig));
    emailjs.init(publicKey);
    
    alert('Email configuration saved!');
    closeEmailSetup();
}

document.getElementById('statusModal').addEventListener('click', (e) => {
    if (e.target.id === 'statusModal') closeModal();
});

document.getElementById('emailSetupModal').addEventListener('click', (e) => {
    if (e.target.id === 'emailSetupModal') closeEmailSetup();
});

function openBroadcastEmail() {
    if (!emailConfig) {
        alert('Please configure email settings first (Email Setup)');
        return;
    }
    document.getElementById('broadcastModal').classList.remove('hidden');
}

function closeBroadcast() {
    document.getElementById('broadcastModal').classList.add('hidden');
    document.getElementById('broadcastSubject').value = '';
    document.getElementById('broadcastMessage').value = '';
}

function sendBroadcastEmail() {
    const subject = document.getElementById('broadcastSubject').value;
    const message = document.getElementById('broadcastMessage').value;
    
    if (!subject || !message) {
        alert('Please fill in subject and message');
        return;
    }
    
    let sentCount = 0;
    let failCount = 0;
    
    users.forEach(user => {
        if (user.email && user.role === 'user') {
            const templateParams = {
                to_email: user.email,
                to_name: user.username,
                subject: subject,
                message: message
            };
            
            emailjs.send(emailConfig.serviceId, emailConfig.templateId, templateParams)
                .then(() => {
                    sentCount++;
                    console.log(`Email sent to ${user.email}`);
                })
                .catch((error) => {
                    failCount++;
                    console.error(`Failed to send to ${user.email}:`, error);
                });
        }
    });
    
    closeBroadcast();
    setTimeout(() => {
        alert(`Emails sent! Check console for details.`);
    }, 1000);
}

document.getElementById('broadcastModal').addEventListener('click', (e) => {
    if (e.target.id === 'broadcastModal') closeBroadcast();
});

function exportToCSV() {
    let csv = 'ID,User,Title,Category,Priority,Status,Due Date,Assigned To,Created Date\n';
    requests.forEach(req => {
        const dueDate = req.dueDate || 'N/A';
        const assignedTo = req.assignedTo || 'Unassigned';
        csv += `${req.id},${req.user},"${req.title}",${req.category},${req.priority},${req.status},${dueDate},${assignedTo},${new Date(req.date).toLocaleDateString()}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

function createNotification(targetUser, message, requestId) {
    const notif = {
        id: Date.now(),
        user: targetUser,
        message: message,
        requestId: requestId,
        read: false,
        date: new Date().toISOString()
    };
    notifications.push(notif);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationCount();
}

function updateNotificationCount() {
    const userNotifs = notifications.filter(n => n.user === currentUser && !n.read);
    const count = userNotifs.length;
    
    const badge = currentRole === 'admin' ? document.getElementById('adminNotifCount') : document.getElementById('userNotifCount');
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

function openNotifications() {
    const userNotifs = notifications.filter(n => n.user === currentUser);
    const list = document.getElementById('notificationsList');
    list.innerHTML = '';
    
    if (userNotifs.length === 0) {
        list.innerHTML = '<p style="text-align:center;padding:20px;color:#666;">No notifications</p>';
    } else {
        userNotifs.reverse().forEach(notif => {
            const div = document.createElement('div');
            div.className = `notification-item ${notif.read ? '' : 'unread'}`;
            div.innerHTML = `
                <p>${notif.message}</p>
                <small>${new Date(notif.date).toLocaleString()}</small>
            `;
            div.onclick = () => {
                notif.read = true;
                localStorage.setItem('notifications', JSON.stringify(notifications));
                updateNotificationCount();
                div.classList.remove('unread');
            };
            list.appendChild(div);
        });
    }
    
    document.getElementById('notificationsModal').classList.remove('hidden');
}

function closeNotifications() {
    document.getElementById('notificationsModal').classList.add('hidden');
}

document.getElementById('notificationsModal').addEventListener('click', (e) => {
    if (e.target.id === 'notificationsModal') closeNotifications();
});

function openProfile() {
    const user = users.find(u => u.username === currentUser);
    document.getElementById('profileUsername').value = user.username;
    document.getElementById('profileEmail').value = user.email;
    document.getElementById('profileNewPassword').value = '';
    document.getElementById('profileModal').classList.remove('hidden');
}

function closeProfile() {
    document.getElementById('profileModal').classList.add('hidden');
}

document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = users.find(u => u.username === currentUser);
    user.email = document.getElementById('profileEmail').value;
    const newPassword = document.getElementById('profileNewPassword').value;
    if (newPassword) {
        user.password = newPassword;
    }
    localStorage.setItem('users', JSON.stringify(users));
    alert('Profile updated successfully!');
    closeProfile();
});

document.getElementById('profileModal').addEventListener('click', (e) => {
    if (e.target.id === 'profileModal') closeProfile();
});

function openComments(reqId) {
    currentCommentReqId = reqId;
    const req = requests.find(r => r.id === reqId);
    const list = document.getElementById('commentsList');
    list.innerHTML = '';
    
    if (!req.comments || req.comments.length === 0) {
        list.innerHTML = '<p style="text-align:center;padding:20px;color:#666;">No comments yet</p>';
    } else {
        req.comments.forEach(comment => {
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `
                <strong>${comment.user}</strong>: ${comment.text}<br>
                <small>${new Date(comment.date).toLocaleString()}</small>
            `;
            list.appendChild(div);
        });
    }
    
    document.getElementById('commentsModal').classList.remove('hidden');
}

function closeComments() {
    document.getElementById('commentsModal').classList.add('hidden');
    currentCommentReqId = null;
}

function addComment() {
    const text = document.getElementById('newComment').value.trim();
    if (!text) {
        alert('Please enter a comment');
        return;
    }
    
    const req = requests.find(r => r.id === currentCommentReqId);
    if (!req.comments) req.comments = [];
    
    req.comments.push({
        user: currentUser,
        text: text,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('requests', JSON.stringify(requests));
    
    const targetUser = currentRole === 'admin' ? req.user : 'admin';
    createNotification(targetUser, `New comment on request #${req.id}`, req.id);
    
    document.getElementById('newComment').value = '';
    openComments(currentCommentReqId);
    
    if (currentRole === 'user') {
        renderUserTable();
    }
}

document.getElementById('commentsModal').addEventListener('click', (e) => {
    if (e.target.id === 'commentsModal') closeComments();
});

function updateStatus() {
    const req = requests.find(r => r.id === currentEditId);
    const oldStatus = req.status;
    const newStatus = document.getElementById('newStatus').value;
    req.status = newStatus;
    req.note = document.getElementById('statusNote').value;

    localStorage.setItem('requests', JSON.stringify(requests));
    
    if (newStatus !== oldStatus) {
        createNotification(req.user, `Request #${req.id} status changed to ${newStatus}`, req.id);
    }
    
    if (newStatus === 'Completed' && oldStatus !== 'Completed') {
        sendEmailNotification(req);
    }
    
    closeModal();
    updateAdminStats();
    renderAdminTable();
    alert('Status updated!');
}
