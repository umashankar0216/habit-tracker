"use client"

import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"

interface ExportDataProps {
  habits: Array<{
    id: string
    name: string
    completedDays: Set<number>
  }>
  sleepLog: { [day: number]: number }
  month: string
  userName: string
}

export function ExportData({ habits, sleepLog, month, userName }: ExportDataProps) {
  const exportToCSV = () => {
    const rows = [["Habit", "Day", "Completed"]]

    habits.forEach((habit) => {
      for (let day = 1; day <= 31; day++) {
        rows.push([habit.name, day.toString(), habit.completedDays.has(day) ? "Yes" : "No"])
      }
    })

    // Add sleep data
    rows.push([])
    rows.push(["Sleep Hours", "Day", "Hours"])
    Object.entries(sleepLog).forEach(([day, hours]) => {
      rows.push(["Sleep", day, hours.toString()])
    })

    const csvContent = rows.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${userName}-${month}-habits.csv`
    a.click()
  }

  const exportToPDF = () => {
    alert("PDF export coming soon! For now, try printing this page (Ctrl+P / Cmd+P)")
  }

  return (
    <div className="flex gap-2">
      <Button onClick={exportToCSV} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
      <Button onClick={exportToPDF} variant="outline" size="sm">
        <FileText className="h-4 w-4 mr-2" />
        Export PDF
      </Button>
    </div>
  )
}
