"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  FileDown, 
  Users, 
  Calendar,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText,
  Archive
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'AGENT'
}

interface BulkReportFormData {
  userIds: string[]
  startDate: string
  endDate: string
  format: 'PDF' | 'EXCEL'
  reportType: 'individual' | 'consolidated'
}

export default function BulkCSCReportGenerator() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [formData, setFormData] = useState<BulkReportFormData>({
    userIds: [],
    startDate: '',
    endDate: '',
    format: 'PDF',
    reportType: 'individual'
  })

  // Load users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  // Update formData when selectedUsers changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      userIds: selectedUsers
    }))
  }, [selectedUsers])

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true)
      const response = await fetch('/api/admin/bulk-reports')
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else {
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedUsers(users.map(user => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId])
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId))
      setSelectAll(false)
    }
  }

  const validateForm = (): string | null => {
    if (!formData.startDate || !formData.endDate) {
      return "Please select both start and end dates"
    }
    
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      return "Start date must be before or equal to end date"
    }

    if (selectedUsers.length === 0) {
      return "Please select at least one user"
    }

    return null
  }

  const generateBulkReport = async () => {
    const validationError = validateForm()
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      
      const response = await fetch('/api/admin/bulk-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        // Get filename from response headers
        const contentDisposition = response.headers.get('Content-Disposition')
        let filename = `CSC_Form_48_Bulk_${formData.startDate}_to_${formData.endDate}`
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }

        // Create blob and download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: `Bulk CSC Form 48 report generated successfully for ${selectedUsers.length} users`,
        })

      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to generate report",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getSelectedUsersText = () => {
    if (selectedUsers.length === 0) return "No users selected"
    if (selectedUsers.length === users.length) return "All users selected"
    return `${selectedUsers.length} users selected`
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileDown className="w-6 h-6 text-blue-600" />
          <span>Bulk CSC Form 48 Generator</span>
        </CardTitle>
        <CardDescription>
          Generate CSC Form 48 (Daily Time Record) reports for multiple users
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Date Range Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>

        {/* Format and Report Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select
              value={formData.format}
              onValueChange={(value: 'PDF' | 'EXCEL') => setFormData(prev => ({ ...prev, format: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PDF">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>PDF</span>
                  </div>
                </SelectItem>
                <SelectItem value="EXCEL">
                  <div className="flex items-center space-x-2">
                    <FileDown className="w-4 h-4" />
                    <span>Excel</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reportType">Report Type</Label>
            <Select
              value={formData.reportType}
              onValueChange={(value: 'individual' | 'consolidated') => setFormData(prev => ({ ...prev, reportType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">
                  <div className="flex items-center space-x-2">
                    <Archive className="w-4 h-4" />
                    <span>Individual Files (ZIP)</span>
                  </div>
                </SelectItem>
                <SelectItem value="consolidated">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Consolidated Report</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Report Type Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Report Type Information</AlertTitle>
          <AlertDescription>
            {formData.reportType === 'individual' 
              ? "Individual Files: Each user gets their own CSC Form 48 file, all packaged in a ZIP archive."
              : "Consolidated Report: All users' CSC Form 48 reports are combined into a single file with multiple pages/sheets."
            }
          </AlertDescription>
        </Alert>

        {/* User Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Select Users</Label>
            <Badge variant="outline" className="text-sm">
              {getSelectedUsersText()}
            </Badge>
          </div>
          
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : (
            <>
              {/* Select All Checkbox */}
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <Checkbox
                  id="selectAll"
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="selectAll" className="font-medium">
                  Select All Users ({users.length})
                </Label>
              </div>

              {/* Users List */}
              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      id={user.id}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={user.id} className="cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{user.name || user.email}</span>
                          <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                            {user.role}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 ml-6">{user.email}</div>
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Generate Button */}
        <div className="flex justify-end space-x-4">
          <Button
            onClick={generateBulkReport}
            disabled={isLoading || selectedUsers.length === 0 || !formData.startDate || !formData.endDate}
            className="min-w-[200px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>

        {/* Summary Info */}
        {selectedUsers.length > 0 && formData.startDate && formData.endDate && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Generation Summary</AlertTitle>
            <AlertDescription>
              Ready to generate {formData.reportType === 'individual' ? 'individual' : 'consolidated'} CSC Form 48 reports 
              for {selectedUsers.length} user(s) from {formData.startDate} to {formData.endDate} in {formData.format} format.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}