"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { ExportFormat } from "@/lib/types"

interface ExportButtonProps {
  experimentId: string
  format?: ExportFormat
}

export function ExportButton({ experimentId, format = "json" }: ExportButtonProps) {
  const handleExport = () => {
    const url = `/api/export/${experimentId}?format=${format}`
    window.open(url, "_blank")
  }

  return (
    <Button onClick={handleExport} variant="outline">
      <Download className="mr-2 h-4 w-4" />
      Export as {format.toUpperCase()}
    </Button>
  )
}

