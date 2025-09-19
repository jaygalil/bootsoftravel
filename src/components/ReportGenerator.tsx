"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CalendarIcon, FileText, Download, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'AGENT'
}

interface ReportGeneratorProps {
  currentUser: User
}

export function ReportGenerator({ currentUser }: ReportGeneratorProps) {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id)
  const [reportFormat, setReportFormat] = useState<'PDF' | 'EXCEL' | 'DUAL_PDF'>('PDF')
  const [users, setUsers] = useState<User[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (currentUser.role === 'ADMIN') {
      fetchUsers()
    }
  }, [currentUser.role])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/auth/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleGenerateReport = async () => {
    // Validate inputs
    if (!startDate || !endDate) {
      toast({
        title: "Invalid Date Range",
        description: "Please select both start and end dates",
        variant: "destructive",
      })
      return
    }

    if (startDate > endDate) {
      toast({
        title: "Invalid Date Range",
        description: "Start date must be before end date",
        variant: "destructive",
      })
      return
    }

    // Check if date range is too large (more than 3 months)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays > 90) {
      toast({
        title: "Date Range Too Large",
        description: "Please select a date range of 90 days or less",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: reportFormat,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          userId: currentUser.role === 'ADMIN' ? selectedUserId : currentUser.id,
        }),
      })

      if (response.ok) {
        // Get the file blob
        const blob = await response.blob()
        
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        // Get filename from response headers or generate one
        const contentDisposition = response.headers.get('content-disposition')
        let filename = `CSC_Form_48_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.${reportFormat.toLowerCase()}`
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }
        
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast({
          title: "Report Generated",
          description: `CSC Form 48 has been downloaded successfully as ${reportFormat} format`,
        })
      } else {
        const data = await response.json()
        toast({
          title: "Generation Failed",
          description: data.error || "Failed to generate report",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Report generation error:', error)
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedUser = users.find(u => u.id === selectedUserId) || currentUser

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate CSC Form 48 Report
        </CardTitle>
        <CardDescription>
          Generate timesheet reports in the official CSC Form 48 format for the specified date range
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Employee Selection (Admin Only) */}
        {currentUser.role === 'ADMIN' && users.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="employee-select">Select Employee</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="employee-select">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {selectedUser.name} ({selectedUser.email})
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {user.name} ({user.email})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Range Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date)
                    setStartDateOpen(false)
                  }}
                  disabled={(date) =>
                    date > new Date() || date < new Date("2020-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick end date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    setEndDate(date)
                    setEndDateOpen(false)
                  }}
                  disabled={(date) => {
                    if (!date) return false
                    return date > new Date() || 
                           date < new Date("2020-01-01") ||
                           (startDate ? date < startDate : false)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <Label>Report Format</Label>
          <Select value={reportFormat} onValueChange={(value: 'PDF' | 'EXCEL' | 'DUAL_PDF') => setReportFormat(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PDF">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Standard PDF (Single Form)
                </div>
              </SelectItem>
              <SelectItem value="DUAL_PDF">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Dual PDF (2 Forms per A4) - Recommended
                </div>
              </SelectItem>
              <SelectItem value="EXCEL">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Excel Spreadsheet (.xlsx)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preview Information */}
        {startDate && endDate && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-medium">Report Preview</h4>
            <div className="text-sm space-y-1">
              <p><strong>Employee:</strong> {selectedUser.name}</p>
              <p><strong>Period:</strong> {format(startDate, "MMMM d, yyyy")} - {format(endDate, "MMMM d, yyyy")}</p>
              <p><strong>Format:</strong> {reportFormat}</p>
              <p><strong>Days:</strong> {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1}</p>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerateReport}
          disabled={!startDate || !endDate || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Generate & Download Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}