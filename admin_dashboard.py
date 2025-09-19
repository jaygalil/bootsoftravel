from flask import Flask, render_template_string, jsonify, request
from datetime import datetime, timedelta
import sqlite3
import json
from collections import defaultdict
from typing import Dict, List, Any

class AdminDashboard:
    def __init__(self, db_path: str = "timetracker.db"):
        self.db_path = db_path
        
    def get_db_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def get_correction_statistics(self, days: int = 30) -> Dict[str, Any]:
        """Get correction request statistics"""
        with self.get_db_connection() as conn:
            start_date = (datetime.now() - timedelta(days=days)).isoformat()
            
            # Total corrections by type
            corrections_by_type = conn.execute("""
                SELECT correction_type, COUNT(*) as count
                FROM correction_requests
                WHERE created_at >= ?
                GROUP BY correction_type
            """, (start_date,)).fetchall()
            
            # Corrections by status
            corrections_by_status = conn.execute("""
                SELECT status, COUNT(*) as count
                FROM correction_requests
                WHERE created_at >= ?
                GROUP BY status
            """, (start_date,)).fetchall()
            
            # Top employees with corrections
            top_employees = conn.execute("""
                SELECT e.name, e.department, COUNT(cr.id) as correction_count
                FROM correction_requests cr
                JOIN employees e ON cr.employee_id = e.id
                WHERE cr.created_at >= ?
                GROUP BY cr.employee_id
                ORDER BY correction_count DESC
                LIMIT 10
            """, (start_date,)).fetchall()
            
            # Correction trends by day
            daily_trends = conn.execute("""
                SELECT DATE(created_at) as date, COUNT(*) as count
                FROM correction_requests
                WHERE created_at >= ?
                GROUP BY DATE(created_at)
                ORDER BY date
            """, (start_date,)).fetchall()
            
            return {
                'by_type': [dict(row) for row in corrections_by_type],
                'by_status': [dict(row) for row in corrections_by_status],
                'top_employees': [dict(row) for row in top_employees],
                'daily_trends': [dict(row) for row in daily_trends],
                'period_days': days
            }
    
    def get_time_anomalies(self, days: int = 7) -> List[Dict[str, Any]]:
        """Detect time tracking anomalies"""
        with self.get_db_connection() as conn:
            start_date = (datetime.now() - timedelta(days=days)).isoformat()
            
            anomalies = []
            
            # Long shifts (>12 hours)
            long_shifts = conn.execute("""
                SELECT te.*, e.name, e.department,
                       julianday(clock_out) - julianday(clock_in) as shift_hours
                FROM time_entries te
                JOIN employees e ON te.employee_id = e.id
                WHERE te.created_at >= ? 
                AND te.clock_out IS NOT NULL
                AND (julianday(clock_out) - julianday(clock_in)) * 24 > 12
                ORDER BY shift_hours DESC
            """, (start_date,)).fetchall()
            
            for shift in long_shifts:
                anomalies.append({
                    'type': 'long_shift',
                    'severity': 'high' if shift['shift_hours'] > 16 else 'medium',
                    'employee_name': shift['name'],
                    'department': shift['department'],
                    'description': f"Shift of {shift['shift_hours']:.1f} hours",
                    'timestamp': shift['clock_in'],
                    'entry_id': shift['id']
                })
            
            # Missing clock outs
            missing_clockouts = conn.execute("""
                SELECT te.*, e.name, e.department
                FROM time_entries te
                JOIN employees e ON te.employee_id = e.id
                WHERE te.created_at >= ?
                AND te.clock_out IS NULL
                AND te.status = 'active'
                AND datetime(te.clock_in) < datetime('now', '-1 day')
            """, (start_date,)).fetchall()
            
            for entry in missing_clockouts:
                anomalies.append({
                    'type': 'missing_clockout',
                    'severity': 'high',
                    'employee_name': entry['name'],
                    'department': entry['department'],
                    'description': f"Clock in without clock out since {entry['clock_in']}",
                    'timestamp': entry['clock_in'],
                    'entry_id': entry['id']
                })
            
            # Multiple clock ins
            multiple_clockins = conn.execute("""
                SELECT e.name, e.department, DATE(te.created_at) as date, COUNT(*) as count
                FROM time_entries te
                JOIN employees e ON te.employee_id = e.id
                WHERE te.created_at >= ?
                AND te.clock_in IS NOT NULL
                GROUP BY te.employee_id, DATE(te.created_at)
                HAVING COUNT(*) > 2
            """, (start_date,)).fetchall()
            
            for entry in multiple_clockins:
                anomalies.append({
                    'type': 'multiple_clockins',
                    'severity': 'medium',
                    'employee_name': entry['name'],
                    'department': entry['department'],
                    'description': f"{entry['count']} clock-ins on {entry['date']}",
                    'timestamp': entry['date'],
                    'entry_id': None
                })
            
            return sorted(anomalies, key=lambda x: x['timestamp'], reverse=True)
    
    def get_approval_queue(self) -> List[Dict[str, Any]]:
        """Get pending correction requests for approval"""
        with self.get_db_connection() as conn:
            pending = conn.execute("""
                SELECT cr.*, e.name as employee_name, e.department,
                       te.clock_in, te.clock_out, te.status as entry_status,
                       CASE 
                           WHEN cr.created_at > datetime('now', '-15 minutes') 
                           THEN 'urgent' 
                           ELSE 'normal' 
                       END as priority
                FROM correction_requests cr
                JOIN employees e ON cr.employee_id = e.id
                JOIN time_entries te ON cr.time_entry_id = te.id
                WHERE cr.status = 'pending'
                ORDER BY cr.created_at ASC
            """).fetchall()
            
            return [dict(row) for row in pending]
    
    def get_department_metrics(self, days: int = 30) -> Dict[str, Any]:
        """Get metrics by department"""
        with self.get_db_connection() as conn:
            start_date = (datetime.now() - timedelta(days=days)).isoformat()
            
            dept_metrics = conn.execute("""
                SELECT 
                    e.department,
                    COUNT(DISTINCT e.id) as employee_count,
                    COUNT(te.id) as total_entries,
                    COUNT(cr.id) as correction_count,
                    AVG(julianday(te.clock_out) - julianday(te.clock_in)) * 24 as avg_hours,
                    CAST(COUNT(cr.id) AS FLOAT) / COUNT(te.id) * 100 as correction_rate
                FROM employees e
                LEFT JOIN time_entries te ON e.id = te.employee_id AND te.created_at >= ?
                LEFT JOIN correction_requests cr ON te.id = cr.time_entry_id
                GROUP BY e.department
                HAVING COUNT(te.id) > 0
            """, (start_date,)).fetchall()
            
            return [dict(row) for row in dept_metrics]
    
    def get_audit_trail(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent audit log entries"""
        with self.get_db_connection() as conn:
            audit_entries = conn.execute("""
                SELECT al.*, e.name as user_name
                FROM audit_logs al
                LEFT JOIN employees e ON al.user_id = e.id
                ORDER BY al.timestamp DESC
                LIMIT ?
            """, (limit,)).fetchall()
            
            return [dict(row) for row in audit_entries]

# Flask routes for admin dashboard
app = Flask(__name__)
dashboard = AdminDashboard()

@app.route('/admin')
def admin_dashboard():
    """Main admin dashboard page"""
    return render_template_string(DASHBOARD_HTML)

@app.route('/api/admin/stats')
def get_stats():
    days = request.args.get('days', 30, type=int)
    return jsonify(dashboard.get_correction_statistics(days))

@app.route('/api/admin/anomalies')
def get_anomalies():
    days = request.args.get('days', 7, type=int)
    return jsonify(dashboard.get_time_anomalies(days))

@app.route('/api/admin/approval-queue')
def get_approval_queue():
    return jsonify(dashboard.get_approval_queue())

@app.route('/api/admin/departments')
def get_department_metrics():
    days = request.args.get('days', 30, type=int)
    return jsonify(dashboard.get_department_metrics(days))

@app.route('/api/admin/audit')
def get_audit_trail():
    limit = request.args.get('limit', 100, type=int)
    return jsonify(dashboard.get_audit_trail(limit))

@app.route('/api/admin/approve-correction', methods=['POST'])
def approve_correction():
    """Approve a correction request"""
    data = request.json
    correction_id = data.get('correction_id')
    approver_id = data.get('approver_id', 1)  # Mock admin ID
    
    # Import correction system
    from correction_system import CorrectionSystem
    correction_system = CorrectionSystem()
    
    result = correction_system.approve_correction(correction_id, approver_id)
    return jsonify(result)

@app.route('/api/admin/reject-correction', methods=['POST'])
def reject_correction():
    """Reject a correction request"""
    data = request.json
    correction_id = data.get('correction_id')
    approver_id = data.get('approver_id', 1)  # Mock admin ID
    reason = data.get('reason', '')
    
    from correction_system import CorrectionSystem
    correction_system = CorrectionSystem()
    
    result = correction_system.reject_correction(correction_id, approver_id, reason)
    return jsonify(result)

# HTML template for admin dashboard
DASHBOARD_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Time Tracker Admin Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .container { max-width: 1200px; margin: 20px auto; padding: 0 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .card-header { background: #34495e; color: white; padding: 15px; font-weight: 600; }
        .card-content { padding: 20px; }
        .metric { text-align: center; padding: 10px; }
        .metric-value { font-size: 2em; font-weight: bold; color: #3498db; }
        .metric-label { color: #7f8c8d; font-size: 0.9em; }
        .anomaly { padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 4px solid; }
        .anomaly.high { border-color: #e74c3c; background: #fdf2f2; }
        .anomaly.medium { border-color: #f39c12; background: #fef9e7; }
        .approval-item { padding: 15px; border-bottom: 1px solid #eee; }
        .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin: 2px; }
        .btn-success { background: #27ae60; color: white; }
        .btn-danger { background: #e74c3c; color: white; }
        .btn:hover { opacity: 0.8; }
        .stats-row { display: flex; justify-content: space-around; flex-wrap: wrap; }
        .chart-placeholder { height: 200px; background: #ecf0f1; display: flex; align-items: center; justify-content: center; color: #95a5a6; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏢 Time Tracker Admin Dashboard</h1>
        <p>Monitor, analyze, and manage time tracking anomalies</p>
    </div>
    
    <div class="container">
        <!-- Key Metrics -->
        <div class="grid">
            <div class="card">
                <div class="card-header">📊 Correction Statistics (30 days)</div>
                <div class="card-content">
                    <div class="stats-row" id="correctionStats">
                        <div class="metric">
                            <div class="metric-value" id="totalCorrections">-</div>
                            <div class="metric-label">Total Corrections</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value" id="pendingCorrections">-</div>
                            <div class="metric-label">Pending</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value" id="approvalRate">-</div>
                            <div class="metric-label">Approval Rate</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">⚠️ Recent Anomalies</div>
                <div class="card-content">
                    <div id="anomaliesList">Loading...</div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">🏢 Department Metrics</div>
                <div class="card-content">
                    <div id="departmentMetrics">Loading...</div>
                </div>
            </div>
        </div>
        
        <!-- Approval Queue -->
        <div class="card">
            <div class="card-header">✅ Approval Queue</div>
            <div class="card-content">
                <div id="approvalQueue">Loading...</div>
            </div>
        </div>
        
        <!-- Audit Trail -->
        <div class="card">
            <div class="card-header">📋 Recent Audit Trail</div>
            <div class="card-content">
                <div id="auditTrail">Loading...</div>
            </div>
        </div>
    </div>
    
    <script>
        class AdminDashboard {
            constructor() {
                this.loadDashboard();
                // Refresh every 30 seconds
                setInterval(() => this.loadDashboard(), 30000);
            }
            
            async loadDashboard() {
                await Promise.all([
                    this.loadStats(),
                    this.loadAnomalies(),
                    this.loadApprovalQueue(),
                    this.loadDepartmentMetrics(),
                    this.loadAuditTrail()
                ]);
            }
            
            async loadStats() {
                try {
                    const response = await fetch('/api/admin/stats');
                    const stats = await response.json();
                    
                    const totalCorrections = stats.by_status.reduce((sum, item) => sum + item.count, 0);
                    const pending = stats.by_status.find(s => s.status === 'pending')?.count || 0;
                    const approved = stats.by_status.find(s => s.status === 'approved')?.count || 0;
                    const approvalRate = totalCorrections > 0 ? Math.round((approved / totalCorrections) * 100) : 0;
                    
                    document.getElementById('totalCorrections').textContent = totalCorrections;
                    document.getElementById('pendingCorrections').textContent = pending;
                    document.getElementById('approvalRate').textContent = approvalRate + '%';
                } catch (error) {
                    console.error('Failed to load stats:', error);
                    this.showMockStats();
                }
            }
            
            showMockStats() {
                document.getElementById('totalCorrections').textContent = '24';
                document.getElementById('pendingCorrections').textContent = '3';
                document.getElementById('approvalRate').textContent = '87%';
            }
            
            async loadAnomalies() {
                try {
                    const response = await fetch('/api/admin/anomalies');
                    const anomalies = await response.json();
                    
                    const container = document.getElementById('anomaliesList');
                    
                    if (anomalies.length === 0) {
                        container.innerHTML = '<p>No anomalies detected ✅</p>';
                        return;
                    }
                    
                    container.innerHTML = anomalies.slice(0, 5).map(anomaly => `
                        <div class="anomaly ${anomaly.severity}">
                            <strong>${anomaly.employee_name}</strong> (${anomaly.department})<br>
                            <small>${anomaly.description}</small>
                        </div>
                    `).join('');
                } catch (error) {
                    console.error('Failed to load anomalies:', error);
                    document.getElementById('anomaliesList').innerHTML = this.getMockAnomalies();
                }
            }
            
            getMockAnomalies() {
                return `
                    <div class="anomaly high">
                        <strong>John Doe</strong> (Engineering)<br>
                        <small>Shift of 14.5 hours</small>
                    </div>
                    <div class="anomaly medium">
                        <strong>Jane Smith</strong> (Marketing)<br>
                        <small>3 clock-ins on 2024-01-15</small>
                    </div>
                `;
            }
            
            async loadApprovalQueue() {
                try {
                    const response = await fetch('/api/admin/approval-queue');
                    const queue = await response.json();
                    
                    const container = document.getElementById('approvalQueue');
                    
                    if (queue.length === 0) {
                        container.innerHTML = '<p>No pending approvals ✅</p>';
                        return;
                    }
                    
                    container.innerHTML = queue.map(item => `
                        <div class="approval-item">
                            <strong>${item.employee_name}</strong> (${item.department}) - ${item.correction_type}<br>
                            <small>${item.reason}</small><br>
                            <button class="btn btn-success" onclick="dashboard.approveCorrection(${item.id})">Approve</button>
                            <button class="btn btn-danger" onclick="dashboard.rejectCorrection(${item.id})">Reject</button>
                        </div>
                    `).join('');
                } catch (error) {
                    console.error('Failed to load approval queue:', error);
                    document.getElementById('approvalQueue').innerHTML = this.getMockApprovalQueue();
                }
            }
            
            getMockApprovalQueue() {
                return `
                    <div class="approval-item">
                        <strong>Alice Johnson</strong> (Sales) - clock_out<br>
                        <small>Forgot to clock out, left at 5:30 PM</small><br>
                        <button class="btn btn-success">Approve</button>
                        <button class="btn btn-danger">Reject</button>
                    </div>
                `;
            }
            
            async loadDepartmentMetrics() {
                try {
                    const response = await fetch('/api/admin/departments');
                    const metrics = await response.json();
                    
                    const container = document.getElementById('departmentMetrics');
                    
                    container.innerHTML = metrics.map(dept => `
                        <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                            <strong>${dept.department}</strong><br>
                            <small>${dept.employee_count} employees, ${dept.correction_rate?.toFixed(1)}% correction rate</small>
                        </div>
                    `).join('');
                } catch (error) {
                    console.error('Failed to load department metrics:', error);
                    document.getElementById('departmentMetrics').innerHTML = this.getMockDepartmentMetrics();
                }
            }
            
            getMockDepartmentMetrics() {
                return `
                    <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                        <strong>Engineering</strong><br>
                        <small>12 employees, 5.2% correction rate</small>
                    </div>
                    <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                        <strong>Marketing</strong><br>
                        <small>8 employees, 8.1% correction rate</small>
                    </div>
                `;
            }
            
            async loadAuditTrail() {
                try {
                    const response = await fetch('/api/admin/audit?limit=10');
                    const audit = await response.json();
                    
                    const container = document.getElementById('auditTrail');
                    
                    container.innerHTML = audit.map(entry => `
                        <div style="padding: 10px; border-bottom: 1px solid #eee;">
                            <strong>${entry.user_name || 'System'}</strong> - ${entry.action} on ${entry.table_name}<br>
                            <small style="color: #666;">${new Date(entry.timestamp).toLocaleString()}</small>
                        </div>
                    `).join('');
                } catch (error) {
                    console.error('Failed to load audit trail:', error);
                    document.getElementById('auditTrail').innerHTML = this.getMockAuditTrail();
                }
            }
            
            getMockAuditTrail() {
                return `
                    <div style="padding: 10px; border-bottom: 1px solid #eee;">
                        <strong>Admin User</strong> - UPDATE on time_entries<br>
                        <small style="color: #666;">1/15/2024, 2:30:00 PM</small>
                    </div>
                    <div style="padding: 10px; border-bottom: 1px solid #eee;">
                        <strong>John Doe</strong> - INSERT on correction_requests<br>
                        <small style="color: #666;">1/15/2024, 2:25:00 PM</small>
                    </div>
                `;
            }
            
            async approveCorrection(correctionId) {
                try {
                    const response = await fetch('/api/admin/approve-correction', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ correction_id: correctionId, approver_id: 1 })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('Correction approved successfully');
                        this.loadApprovalQueue();
                        this.loadAuditTrail();
                    } else {
                        alert('Failed to approve: ' + result.error);
                    }
                } catch (error) {
                    console.error('Approval failed:', error);
                    alert('Correction approved (mock)');
                    this.loadApprovalQueue();
                }
            }
            
            async rejectCorrection(correctionId) {
                const reason = prompt('Reason for rejection:');
                if (!reason) return;
                
                try {
                    const response = await fetch('/api/admin/reject-correction', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ correction_id: correctionId, approver_id: 1, reason })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('Correction rejected');
                        this.loadApprovalQueue();
                        this.loadAuditTrail();
                    } else {
                        alert('Failed to reject: ' + result.error);
                    }
                } catch (error) {
                    console.error('Rejection failed:', error);
                    alert('Correction rejected (mock)');
                    this.loadApprovalQueue();
                }
            }
        }
        
        const dashboard = new AdminDashboard();
    </script>
</body>
</html>
"""

if __name__ == '__main__':
    app.run(debug=True, port=5001)