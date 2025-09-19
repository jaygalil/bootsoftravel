from datetime import datetime
import sqlite3
import json
from typing import Dict, Any, List
from enum import Enum

class CorrectionType(Enum):
    CLOCK_IN = "clock_in"
    CLOCK_OUT = "clock_out"
    BREAK_START = "break_start"
    BREAK_END = "break_end"
    CANCEL_ENTRY = "cancel"
    MANUAL_ENTRY = "manual"

class CorrectionStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class CorrectionSystem:
    def __init__(self, db_path: str = "timetracker.db"):
        self.db_path = db_path
        self.auto_approve_window = 900  # 15 minutes for self-correction
        
    def get_db_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def request_correction(self, employee_id: int, time_entry_id: int, 
                          correction_type: str, requested_time: datetime = None,
                          reason: str = "", original_time: datetime = None) -> Dict[str, Any]:
        """Submit a correction request"""
        
        with self.get_db_connection() as conn:
            # Validate the time entry exists and belongs to employee
            entry = conn.execute(
                "SELECT * FROM time_entries WHERE id = ? AND employee_id = ?",
                (time_entry_id, employee_id)
            ).fetchone()
            
            if not entry:
                return {"success": False, "error": "Time entry not found or access denied"}
            
            # Check if already has pending correction
            existing = conn.execute(
                "SELECT id FROM correction_requests WHERE time_entry_id = ? AND status = 'pending'",
                (time_entry_id,)
            ).fetchone()
            
            if existing:
                return {"success": False, "error": "Pending correction already exists"}
            
            # Determine if auto-approval applies
            entry_time = datetime.fromisoformat(entry['created_at'])
            time_since_entry = (datetime.now() - entry_time).total_seconds()
            auto_approve = time_since_entry <= self.auto_approve_window and correction_type != CorrectionType.MANUAL_ENTRY.value
            
            # Create correction request
            cursor = conn.execute(
                """INSERT INTO correction_requests 
                   (time_entry_id, employee_id, correction_type, original_time, 
                    requested_time, reason, status)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (time_entry_id, employee_id, correction_type, 
                 original_time.isoformat() if original_time else None,
                 requested_time.isoformat() if requested_time else None,
                 reason, CorrectionStatus.APPROVED.value if auto_approve else CorrectionStatus.PENDING.value)
            )
            
            correction_id = cursor.lastrowid
            
            if auto_approve:
                # Apply correction immediately
                self._apply_correction(conn, correction_id, employee_id)
                return {
                    "success": True,
                    "correction_id": correction_id,
                    "status": "auto_approved",
                    "message": "Correction applied automatically"
                }
            
            return {
                "success": True,
                "correction_id": correction_id,
                "status": "pending_approval",
                "message": "Correction request submitted for approval"
            }
    
    def approve_correction(self, correction_id: int, approver_id: int, 
                          notes: str = "") -> Dict[str, Any]:
        """Approve a correction request"""
        
        with self.get_db_connection() as conn:
            # Get correction request
            correction = conn.execute(
                "SELECT * FROM correction_requests WHERE id = ? AND status = 'pending'",
                (correction_id,)
            ).fetchone()
            
            if not correction:
                return {"success": False, "error": "Correction request not found or already processed"}
            
            # Update status
            conn.execute(
                """UPDATE correction_requests 
                   SET status = 'approved', approved_by = ?, approved_at = ?
                   WHERE id = ?""",
                (approver_id, datetime.now().isoformat(), correction_id)
            )
            
            # Apply the correction
            result = self._apply_correction(conn, correction_id, approver_id)
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Correction approved and applied",
                    "correction_id": correction_id
                }
            else:
                # Rollback approval if application failed
                conn.execute(
                    "UPDATE correction_requests SET status = 'pending', approved_by = NULL, approved_at = NULL WHERE id = ?",
                    (correction_id,)
                )
                return {"success": False, "error": f"Failed to apply correction: {result['error']}"}
    
    def reject_correction(self, correction_id: int, approver_id: int, 
                         reason: str = "") -> Dict[str, Any]:
        """Reject a correction request"""
        
        with self.get_db_connection() as conn:
            result = conn.execute(
                """UPDATE correction_requests 
                   SET status = 'rejected', approved_by = ?, approved_at = ?
                   WHERE id = ? AND status = 'pending'""",
                (approver_id, datetime.now().isoformat(), correction_id)
            )
            
            if result.rowcount == 0:
                return {"success": False, "error": "Correction request not found or already processed"}
            
            return {"success": True, "message": "Correction request rejected"}
    
    def _apply_correction(self, conn, correction_id: int, user_id: int) -> Dict[str, Any]:
        """Apply an approved correction to the time entry"""
        
        correction = conn.execute(
            "SELECT * FROM correction_requests WHERE id = ?", (correction_id,)
        ).fetchone()
        
        if not correction:
            return {"success": False, "error": "Correction not found"}
        
        time_entry = conn.execute(
            "SELECT * FROM time_entries WHERE id = ?", (correction['time_entry_id'],)
        ).fetchone()
        
        correction_type = correction['correction_type']
        
        try:
            if correction_type == CorrectionType.CLOCK_IN.value:
                old_value = time_entry['clock_in']
                conn.execute(
                    "UPDATE time_entries SET clock_in = ?, updated_at = ? WHERE id = ?",
                    (correction['requested_time'], datetime.now().isoformat(), correction['time_entry_id'])
                )
                self._log_audit(conn, 'time_entries', correction['time_entry_id'], 'UPDATE',
                               {'clock_in': old_value}, {'clock_in': correction['requested_time']}, user_id)
                
            elif correction_type == CorrectionType.CLOCK_OUT.value:
                old_value = time_entry['clock_out']
                conn.execute(
                    "UPDATE time_entries SET clock_out = ?, status = 'completed', updated_at = ? WHERE id = ?",
                    (correction['requested_time'], datetime.now().isoformat(), correction['time_entry_id'])
                )
                self._log_audit(conn, 'time_entries', correction['time_entry_id'], 'UPDATE',
                               {'clock_out': old_value}, {'clock_out': correction['requested_time']}, user_id)
                
            elif correction_type == CorrectionType.CANCEL_ENTRY.value:
                conn.execute(
                    "UPDATE time_entries SET status = 'cancelled', updated_at = ? WHERE id = ?",
                    (datetime.now().isoformat(), correction['time_entry_id'])
                )
                self._log_audit(conn, 'time_entries', correction['time_entry_id'], 'UPDATE',
                               {'status': time_entry['status']}, {'status': 'cancelled'}, user_id)
                
            elif correction_type == CorrectionType.MANUAL_ENTRY.value:
                # Create new corrected entry
                cursor = conn.execute(
                    """INSERT INTO time_entries 
                       (employee_id, clock_in, clock_out, status, is_correction, original_entry_id, notes)
                       VALUES (?, ?, ?, 'completed', 1, ?, ?)""",
                    (correction['employee_id'], correction['requested_time'], 
                     correction['original_time'], correction['time_entry_id'],
                     f"Manual correction: {correction['reason']}")
                )
                new_entry_id = cursor.lastrowid
                self._log_audit(conn, 'time_entries', new_entry_id, 'INSERT', None,
                               {'correction_for': correction['time_entry_id']}, user_id)
            
            return {"success": True}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def admin_override(self, admin_id: int, time_entry_id: int, 
                      field: str, new_value: str, reason: str) -> Dict[str, Any]:
        """Admin direct override without approval process"""
        
        with self.get_db_connection() as conn:
            # Verify admin permissions (implement your own logic)
            admin = conn.execute(
                "SELECT * FROM employees WHERE id = ? AND department = 'admin'", (admin_id,)
            ).fetchone()
            
            if not admin:
                return {"success": False, "error": "Admin permissions required"}
            
            # Get current entry
            entry = conn.execute(
                "SELECT * FROM time_entries WHERE id = ?", (time_entry_id,)
            ).fetchone()
            
            if not entry:
                return {"success": False, "error": "Time entry not found"}
            
            old_value = entry[field]
            
            # Apply override
            conn.execute(
                f"UPDATE time_entries SET {field} = ?, updated_at = ? WHERE id = ?",
                (new_value, datetime.now().isoformat(), time_entry_id)
            )
            
            # Log as admin override
            self._log_audit(conn, 'time_entries', time_entry_id, 'ADMIN_OVERRIDE',
                           {field: old_value}, {field: new_value, 'reason': reason}, admin_id)
            
            return {"success": True, "message": "Admin override applied"}
    
    def get_pending_corrections(self, department: str = None) -> List[Dict]:
        """Get all pending corrections for approval"""
        
        with self.get_db_connection() as conn:
            query = """
                SELECT cr.*, e.name as employee_name, e.department,
                       te.clock_in, te.clock_out, te.status as entry_status
                FROM correction_requests cr
                JOIN employees e ON cr.employee_id = e.id
                JOIN time_entries te ON cr.time_entry_id = te.id
                WHERE cr.status = 'pending'
            """
            params = []
            
            if department:
                query += " AND e.department = ?"
                params.append(department)
                
            query += " ORDER BY cr.created_at ASC"
            
            corrections = conn.execute(query, params).fetchall()
            
            return [dict(correction) for correction in corrections]
    
    def get_correction_history(self, employee_id: int, limit: int = 50) -> List[Dict]:
        """Get correction history for an employee"""
        
        with self.get_db_connection() as conn:
            corrections = conn.execute(
                """SELECT cr.*, e.name as approved_by_name
                   FROM correction_requests cr
                   LEFT JOIN employees e ON cr.approved_by = e.id
                   WHERE cr.employee_id = ?
                   ORDER BY cr.created_at DESC
                   LIMIT ?""",
                (employee_id, limit)
            ).fetchall()
            
            return [dict(correction) for correction in corrections]
    
    def _log_audit(self, conn, table_name: str, record_id: int, action: str,
                   old_values: Dict, new_values: Dict, user_id: int):
        """Log audit trail"""
        conn.execute(
            """INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (table_name, record_id, action,
             json.dumps(old_values) if old_values else None,
             json.dumps(new_values) if new_values else None,
             user_id)
        )

# Example usage and test functions
def test_correction_system():
    """Test the correction system functionality"""
    system = CorrectionSystem()
    
    # Test self-correction (within 15 minutes)
    result = system.request_correction(
        employee_id=1,
        time_entry_id=1,
        correction_type=CorrectionType.CLOCK_IN.value,
        requested_time=datetime(2024, 1, 15, 9, 0),
        reason="Clicked wrong time by mistake"
    )
    print("Self-correction result:", result)
    
    # Test correction requiring approval
    result = system.request_correction(
        employee_id=1,
        time_entry_id=2,
        correction_type=CorrectionType.CLOCK_OUT.value,
        requested_time=datetime(2024, 1, 15, 17, 30),
        reason="Forgot to clock out, left at 5:30 PM"
    )
    print("Approval required result:", result)

if __name__ == "__main__":
    test_correction_system()