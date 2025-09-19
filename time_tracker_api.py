from flask import Flask, request, jsonify
from datetime import datetime, timedelta
import json
import sqlite3
from typing import Optional, Dict, Any

app = Flask(__name__)

class TimeTracker:
    def __init__(self, db_path: str = "timetracker.db"):
        self.db_path = db_path
        self.grace_period = 300  # 5 minutes in seconds
        self.max_shift_hours = 16
    
    def get_db_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def validate_time_entry(self, employee_id: int, action: str, timestamp: datetime) -> Dict[str, Any]:
        """Validate time entry and prevent common accidents"""
        with self.get_db_connection() as conn:
            # Get latest entry for employee
            latest = conn.execute(
                "SELECT * FROM time_entries WHERE employee_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1",
                (employee_id,)
            ).fetchone()
            
            errors = []
            warnings = []
            
            # Check for future timestamps
            if timestamp > datetime.now():
                errors.append("Cannot clock in/out in the future")
            
            # Check for duplicate actions within grace period
            if latest:
                last_action_time = datetime.fromisoformat(latest['updated_at'])
                time_diff = (timestamp - last_action_time).total_seconds()
                
                if time_diff < self.grace_period:
                    if action == 'clock_in' and latest['clock_out'] is None:
                        warnings.append(f"Already clocked in {int(time_diff/60)} minutes ago")
                    elif action == 'clock_out' and latest['clock_out'] is not None:
                        warnings.append(f"Already clocked out {int(time_diff/60)} minutes ago")
            
            # Check for excessive shift length
            if action == 'clock_out' and latest and latest['clock_in']:
                clock_in_time = datetime.fromisoformat(latest['clock_in'])
                shift_hours = (timestamp - clock_in_time).total_seconds() / 3600
                
                if shift_hours > self.max_shift_hours:
                    warnings.append(f"Shift exceeds {self.max_shift_hours} hours ({shift_hours:.1f}h)")
            
            return {
                "valid": len(errors) == 0,
                "errors": errors,
                "warnings": warnings,
                "requires_confirmation": len(warnings) > 0
            }
    
    def clock_in(self, employee_id: int, location: str = None, ip_address: str = None, 
                 force: bool = False) -> Dict[str, Any]:
        """Handle clock in with accident prevention"""
        now = datetime.now()
        validation = self.validate_time_entry(employee_id, 'clock_in', now)
        
        if not validation["valid"]:
            return {"success": False, "errors": validation["errors"]}
        
        if validation["requires_confirmation"] and not force:
            return {
                "success": False,
                "requires_confirmation": True,
                "warnings": validation["warnings"],
                "action": "clock_in"
            }
        
        with self.get_db_connection() as conn:
            # Check for active entry
            active = conn.execute(
                "SELECT id FROM time_entries WHERE employee_id = ? AND status = 'active' AND clock_out IS NULL",
                (employee_id,)
            ).fetchone()
            
            if active and not force:
                return {
                    "success": False,
                    "error": "Already clocked in",
                    "can_correct": True,
                    "active_entry_id": active['id']
                }
            
            # Create new entry
            cursor = conn.execute(
                """INSERT INTO time_entries (employee_id, clock_in, location, ip_address, status)
                   VALUES (?, ?, ?, ?, 'active')""",
                (employee_id, now.isoformat(), location, ip_address)
            )
            
            entry_id = cursor.lastrowid
            self.log_audit(conn, 'time_entries', entry_id, 'INSERT', None, 
                          {'clock_in': now.isoformat()}, employee_id)
            
            return {
                "success": True,
                "entry_id": entry_id,
                "timestamp": now.isoformat(),
                "warnings": validation.get("warnings", [])
            }
    
    def clock_out(self, employee_id: int, force: bool = False) -> Dict[str, Any]:
        """Handle clock out with accident prevention"""
        now = datetime.now()
        validation = self.validate_time_entry(employee_id, 'clock_out', now)
        
        if not validation["valid"]:
            return {"success": False, "errors": validation["errors"]}
        
        with self.get_db_connection() as conn:
            # Find active entry
            active = conn.execute(
                "SELECT * FROM time_entries WHERE employee_id = ? AND status = 'active' AND clock_out IS NULL",
                (employee_id,)
            ).fetchone()
            
            if not active:
                return {
                    "success": False,
                    "error": "No active clock-in found",
                    "can_correct": True
                }
            
            if validation["requires_confirmation"] and not force:
                return {
                    "success": False,
                    "requires_confirmation": True,
                    "warnings": validation["warnings"],
                    "action": "clock_out",
                    "entry_id": active['id']
                }
            
            # Update entry
            conn.execute(
                "UPDATE time_entries SET clock_out = ?, status = 'completed', updated_at = ? WHERE id = ?",
                (now.isoformat(), now.isoformat(), active['id'])
            )
            
            self.log_audit(conn, 'time_entries', active['id'], 'UPDATE',
                          {'status': 'active'}, {'clock_out': now.isoformat(), 'status': 'completed'}, employee_id)
            
            return {
                "success": True,
                "entry_id": active['id'],
                "timestamp": now.isoformat(),
                "warnings": validation.get("warnings", [])
            }
    
    def quick_undo(self, employee_id: int, entry_id: int) -> Dict[str, Any]:
        """Allow quick undo within grace period"""
        with self.get_db_connection() as conn:
            entry = conn.execute(
                "SELECT * FROM time_entries WHERE id = ? AND employee_id = ?",
                (entry_id, employee_id)
            ).fetchone()
            
            if not entry:
                return {"success": False, "error": "Entry not found"}
            
            # Check if within grace period
            last_update = datetime.fromisoformat(entry['updated_at'])
            if (datetime.now() - last_update).total_seconds() > self.grace_period:
                return {"success": False, "error": "Grace period expired"}
            
            # Undo the action
            if entry['clock_out']:
                # Undo clock out
                conn.execute(
                    "UPDATE time_entries SET clock_out = NULL, status = 'active', updated_at = ? WHERE id = ?",
                    (datetime.now().isoformat(), entry_id)
                )
                action = "clock_out undo"
            else:
                # Cancel clock in
                conn.execute(
                    "UPDATE time_entries SET status = 'cancelled', updated_at = ? WHERE id = ?",
                    (datetime.now().isoformat(), entry_id)
                )
                action = "clock_in cancel"
            
            self.log_audit(conn, 'time_entries', entry_id, 'UPDATE', 
                          {'status': entry['status']}, {'action': action}, employee_id)
            
            return {"success": True, "action": action}
    
    def log_audit(self, conn, table_name: str, record_id: int, action: str, 
                  old_values: Dict, new_values: Dict, user_id: int):
        """Log all changes for audit trail"""
        conn.execute(
            """INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (table_name, record_id, action, 
             json.dumps(old_values) if old_values else None,
             json.dumps(new_values) if new_values else None, 
             user_id)
        )

# Flask API endpoints
tracker = TimeTracker()

@app.route('/api/clock-in', methods=['POST'])
def api_clock_in():
    data = request.json
    employee_id = data.get('employee_id')
    location = data.get('location')
    force = data.get('force', False)
    
    result = tracker.clock_in(employee_id, location, request.remote_addr, force)
    return jsonify(result)

@app.route('/api/clock-out', methods=['POST'])
def api_clock_out():
    data = request.json
    employee_id = data.get('employee_id')
    force = data.get('force', False)
    
    result = tracker.clock_out(employee_id, force)
    return jsonify(result)

@app.route('/api/quick-undo', methods=['POST'])
def api_quick_undo():
    data = request.json
    employee_id = data.get('employee_id')
    entry_id = data.get('entry_id')
    
    result = tracker.quick_undo(employee_id, entry_id)
    return jsonify(result)

@app.route('/api/status/<int:employee_id>')
def api_status(employee_id):
    with tracker.get_db_connection() as conn:
        entry = conn.execute(
            "SELECT * FROM time_entries WHERE employee_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1",
            (employee_id,)
        ).fetchone()
        
        if entry:
            return jsonify({
                "clocked_in": entry['clock_out'] is None,
                "entry_id": entry['id'],
                "clock_in_time": entry['clock_in'],
                "can_undo": (datetime.now() - datetime.fromisoformat(entry['updated_at'])).total_seconds() < tracker.grace_period
            })
        
        return jsonify({"clocked_in": False, "can_undo": False})

if __name__ == '__main__':
    app.run(debug=True)