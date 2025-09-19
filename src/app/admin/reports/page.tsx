"use client"

import BulkCSCReportGenerator from '@/components/BulkCSCReportGenerator'

export default function AdminReportsPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Reports Management
        </h1>
        <p className="text-slate-600">
          Generate and manage attendance reports for users
        </p>
      </div>

      <BulkCSCReportGenerator />
    </div>
  )
}