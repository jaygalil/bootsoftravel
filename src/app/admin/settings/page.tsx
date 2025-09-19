"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  Settings, 
  Shield, 
  Clock,
  Bell,
  Mail,
  Database,
  Users,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Globe,
  Lock,
  Smartphone,
  Calendar,
  FileText
} from 'lucide-react'

interface SystemSettings {
  // General Settings
  systemName: string
  organizationName: string
  timezone: string
  dateFormat: string
  timeFormat: string
  
  // Security Settings
  sessionTimeout: number
  passwordMinLength: number
  requirePasswordReset: boolean
  enableTwoFactor: boolean
  maxLoginAttempts: number
  
  // Time Tracking Settings
  allowEarlyClockIn: boolean
  earlyClockInMinutes: number
  allowLateClockOut: boolean
  lateClockOutMinutes: number
  enableBreakTracking: boolean
  automaticClockOut: boolean
  autoClockOutHours: number
  
  // Notification Settings
  enableEmailNotifications: boolean
  notifyOnLongShifts: boolean
  longShiftHours: number
  notifyOnMissingClockOut: boolean
  notifyOnCorrectionRequest: boolean
  
  // Backup & Maintenance
  autoBackup: boolean
  backupFrequency: string
  retentionPeriodDays: number
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    // General Settings
    systemName: 'Attendance Monitoring System',
    organizationName: 'Department of Information and Communications Technology',
    timezone: 'Asia/Manila',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12-hour',
    
    // Security Settings
    sessionTimeout: 480, // 8 hours in minutes
    passwordMinLength: 8,
    requirePasswordReset: false,
    enableTwoFactor: false,
    maxLoginAttempts: 3,
    
    // Time Tracking Settings
    allowEarlyClockIn: true,
    earlyClockInMinutes: 15,
    allowLateClockOut: true,
    lateClockOutMinutes: 30,
    enableBreakTracking: false,
    automaticClockOut: true,
    autoClockOutHours: 12,
    
    // Notification Settings
    enableEmailNotifications: true,
    notifyOnLongShifts: true,
    longShiftHours: 10,
    notifyOnMissingClockOut: true,
    notifyOnCorrectionRequest: true,
    
    // Backup & Maintenance
    autoBackup: true,
    backupFrequency: 'daily',
    retentionPeriodDays: 90
  })
  
  const [loading, setLoading] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const { toast } = useToast()

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setUnsavedChanges(true)
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully",
      })
      setUnsavedChanges(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetSettings = () => {
    // Reset to default values
    setSettings({
      systemName: 'Attendance Monitoring System',
      organizationName: 'Department of Information and Communications Technology',
      timezone: 'Asia/Manila',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: '12-hour',
      sessionTimeout: 480,
      passwordMinLength: 8,
      requirePasswordReset: false,
      enableTwoFactor: false,
      maxLoginAttempts: 3,
      allowEarlyClockIn: true,
      earlyClockInMinutes: 15,
      allowLateClockOut: true,
      lateClockOutMinutes: 30,
      enableBreakTracking: false,
      automaticClockOut: true,
      autoClockOutHours: 12,
      enableEmailNotifications: true,
      notifyOnLongShifts: true,
      longShiftHours: 10,
      notifyOnMissingClockOut: true,
      notifyOnCorrectionRequest: true,
      autoBackup: true,
      backupFrequency: 'daily',
      retentionPeriodDays: 90
    })
    setUnsavedChanges(true)
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to default values",
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">System Settings</h1>
          <p className="text-slate-600 mt-1">Configure system preferences and behavior</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={handleResetSettings}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>
          <Button 
            onClick={handleSaveSettings}
            disabled={loading || !unsavedChanges}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <Save className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Unsaved Changes Alert */}
      {unsavedChanges && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">You have unsaved changes</span>
              <span className="text-sm text-yellow-700">Remember to save your changes before leaving this page.</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-blue-500" />
              <span>General Settings</span>
            </CardTitle>
            <CardDescription>
              Basic system configuration and display preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="systemName">System Name</Label>
              <Input
                id="systemName"
                value={settings.systemName}
                onChange={(e) => handleSettingChange('systemName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                value={settings.organizationName}
                onChange={(e) => handleSettingChange('organizationName', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Manila">Asia/Manila (GMT+8)</SelectItem>
                    <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select value={settings.dateFormat} onValueChange={(value) => handleSettingChange('dateFormat', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
                    <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
                    <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeFormat">Time Format</Label>
              <Select value={settings.timeFormat} onValueChange={(value) => handleSettingChange('timeFormat', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12-hour">12-hour (AM/PM)</SelectItem>
                  <SelectItem value="24-hour">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-red-500" />
              <span>Security Settings</span>
            </CardTitle>
            <CardDescription>
              Authentication and access control configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordMinLength">Min Password Length</Label>
                <Input
                  id="passwordMinLength"
                  type="number"
                  value={settings.passwordMinLength}
                  onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
              />
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Password Reset</Label>
                  <p className="text-sm text-slate-500">Force users to change password on first login</p>
                </div>
                <Switch
                  checked={settings.requirePasswordReset}
                  onCheckedChange={(checked) => handleSettingChange('requirePasswordReset', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Two-Factor Authentication</Label>
                  <p className="text-sm text-slate-500">Additional security layer for user accounts</p>
                </div>
                <Switch
                  checked={settings.enableTwoFactor}
                  onCheckedChange={(checked) => handleSettingChange('enableTwoFactor', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Tracking Settings */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-500" />
              <span>Time Tracking Settings</span>
            </CardTitle>
            <CardDescription>
              Configure time tracking behavior and rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Early Clock In</Label>
                <p className="text-sm text-slate-500">Let employees clock in before their scheduled time</p>
              </div>
              <Switch
                checked={settings.allowEarlyClockIn}
                onCheckedChange={(checked) => handleSettingChange('allowEarlyClockIn', checked)}
              />
            </div>
            {settings.allowEarlyClockIn && (
              <div className="ml-4 space-y-2">
                <Label htmlFor="earlyClockInMinutes">Early Clock In (minutes)</Label>
                <Input
                  id="earlyClockInMinutes"
                  type="number"
                  value={settings.earlyClockInMinutes}
                  onChange={(e) => handleSettingChange('earlyClockInMinutes', parseInt(e.target.value))}
                />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Late Clock Out</Label>
                <p className="text-sm text-slate-500">Let employees clock out after their scheduled time</p>
              </div>
              <Switch
                checked={settings.allowLateClockOut}
                onCheckedChange={(checked) => handleSettingChange('allowLateClockOut', checked)}
              />
            </div>
            {settings.allowLateClockOut && (
              <div className="ml-4 space-y-2">
                <Label htmlFor="lateClockOutMinutes">Late Clock Out (minutes)</Label>
                <Input
                  id="lateClockOutMinutes"
                  type="number"
                  value={settings.lateClockOutMinutes}
                  onChange={(e) => handleSettingChange('lateClockOutMinutes', parseInt(e.target.value))}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Break Tracking</Label>
                <p className="text-sm text-slate-500">Track employee break times</p>
              </div>
              <Switch
                checked={settings.enableBreakTracking}
                onCheckedChange={(checked) => handleSettingChange('enableBreakTracking', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Automatic Clock Out</Label>
                <p className="text-sm text-slate-500">Automatically clock out after specified hours</p>
              </div>
              <Switch
                checked={settings.automaticClockOut}
                onCheckedChange={(checked) => handleSettingChange('automaticClockOut', checked)}
              />
            </div>
            {settings.automaticClockOut && (
              <div className="ml-4 space-y-2">
                <Label htmlFor="autoClockOutHours">Auto Clock Out (hours)</Label>
                <Input
                  id="autoClockOutHours"
                  type="number"
                  value={settings.autoClockOutHours}
                  onChange={(e) => handleSettingChange('autoClockOutHours', parseInt(e.target.value))}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-yellow-500" />
              <span>Notification Settings</span>
            </CardTitle>
            <CardDescription>
              Configure system notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Email Notifications</Label>
                <p className="text-sm text-slate-500">Send notifications via email</p>
              </div>
              <Switch
                checked={settings.enableEmailNotifications}
                onCheckedChange={(checked) => handleSettingChange('enableEmailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notify on Long Shifts</Label>
                <p className="text-sm text-slate-500">Alert when employees work extended hours</p>
              </div>
              <Switch
                checked={settings.notifyOnLongShifts}
                onCheckedChange={(checked) => handleSettingChange('notifyOnLongShifts', checked)}
              />
            </div>
            {settings.notifyOnLongShifts && (
              <div className="ml-4 space-y-2">
                <Label htmlFor="longShiftHours">Long Shift Threshold (hours)</Label>
                <Input
                  id="longShiftHours"
                  type="number"
                  value={settings.longShiftHours}
                  onChange={(e) => handleSettingChange('longShiftHours', parseInt(e.target.value))}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notify on Missing Clock Out</Label>
                <p className="text-sm text-slate-500">Alert when employees forget to clock out</p>
              </div>
              <Switch
                checked={settings.notifyOnMissingClockOut}
                onCheckedChange={(checked) => handleSettingChange('notifyOnMissingClockOut', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notify on Correction Requests</Label>
                <p className="text-sm text-slate-500">Alert admins when correction requests are submitted</p>
              </div>
              <Switch
                checked={settings.notifyOnCorrectionRequest}
                onCheckedChange={(checked) => handleSettingChange('notifyOnCorrectionRequest', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Backup & Maintenance */}
        <Card className="border-0 shadow-lg xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-purple-500" />
              <span>Backup & Maintenance</span>
            </CardTitle>
            <CardDescription>
              Data backup and system maintenance configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatic Backup</Label>
                    <p className="text-sm text-slate-500">Enable scheduled data backups</p>
                  </div>
                  <Switch
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
                  />
                </div>
                {settings.autoBackup && (
                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select value={settings.backupFrequency} onValueChange={(value) => handleSettingChange('backupFrequency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="retentionPeriodDays">Data Retention (days)</Label>
                  <Input
                    id="retentionPeriodDays"
                    type="number"
                    value={settings.retentionPeriodDays}
                    onChange={(e) => handleSettingChange('retentionPeriodDays', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-slate-500">How long to keep backup data</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Maintenance Actions</Label>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Database className="w-4 h-4 mr-2" />
                      Create Backup Now
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Clear System Cache
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Export System Logs
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>System Status</span>
          </CardTitle>
          <CardDescription>
            Current system health and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-800">System Online</h3>
              <p className="text-sm text-green-600">All services running</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-800">Database</h3>
              <p className="text-sm text-blue-600">Connected & healthy</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-purple-800">Active Users</h3>
              <p className="text-sm text-purple-600">3 users online</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-orange-800">Last Backup</h3>
              <p className="text-sm text-orange-600">2 hours ago</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}