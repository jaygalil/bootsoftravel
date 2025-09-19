"use client"

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Clock, AlertTriangle, CheckCircle, TrendingUp, Calendar, FileText } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-slate-600">
          Overview of attendance monitoring system
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Users</p>
                <p className="text-3xl font-bold text-blue-600">24</p>
                <p className="text-xs text-slate-500 mt-1">+2 this week</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Sessions</p>
                <p className="text-3xl font-bold text-green-600">12</p>
                <p className="text-xs text-slate-500 mt-1">Currently online</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending Corrections</p>
                <p className="text-3xl font-bold text-orange-600">3</p>
                <p className="text-xs text-slate-500 mt-1">Require attention</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Completion Rate</p>
                <p className="text-3xl font-bold text-purple-600">94%</p>
                <p className="text-xs text-slate-500 mt-1">This month</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Latest user actions and system events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">John Doe</p>
                  <p className="text-sm text-slate-600">Clocked in</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Success
                  </Badge>
                  <p className="text-xs text-slate-500 mt-1">2 min ago</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">Jane Smith</p>
                  <p className="text-sm text-slate-600">Requested correction</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                    Pending
                  </Badge>
                  <p className="text-xs text-slate-500 mt-1">15 min ago</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">Mike Johnson</p>
                  <p className="text-sm text-slate-600">Clocked out</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Complete
                  </Badge>
                  <p className="text-xs text-slate-500 mt-1">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>System Alerts</span>
            </CardTitle>
            <CardDescription>
              Items that need your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">Long Shift Detected</h4>
                    <p className="text-sm text-red-700">Alice Johnson has been clocked in for 14 hours</p>
                    <p className="text-xs text-red-600 mt-1">Engineering Department</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Missing Clock Out</h4>
                    <p className="text-sm text-yellow-700">3 users forgot to clock out yesterday</p>
                    <p className="text-xs text-yellow-600 mt-1">Multiple departments</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Usage Trend</h4>
                    <p className="text-sm text-blue-700">System usage increased by 15% this week</p>
                    <p className="text-xs text-blue-600 mt-1">All departments</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-slate-600" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg cursor-pointer hover:shadow-lg transition-shadow">
              <Users className="w-6 h-6 mb-2" />
              <h3 className="font-medium">Manage Users</h3>
              <p className="text-sm opacity-90">Add or edit user accounts</p>
            </div>
            
            <Link href="/admin/reports">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg cursor-pointer hover:shadow-lg transition-shadow">
                <FileText className="w-6 h-6 mb-2" />
                <h3 className="font-medium">Bulk CSC Reports</h3>
                <p className="text-sm opacity-90">Generate Form 48 for multiple users</p>
              </div>
            </Link>
            
            <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg cursor-pointer hover:shadow-lg transition-shadow">
              <CheckCircle className="w-6 h-6 mb-2" />
              <h3 className="font-medium">Approve Corrections</h3>
              <p className="text-sm opacity-90">Review pending requests</p>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg cursor-pointer hover:shadow-lg transition-shadow">
              <AlertTriangle className="w-6 h-6 mb-2" />
              <h3 className="font-medium">System Health</h3>
              <p className="text-sm opacity-90">Monitor system status</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}