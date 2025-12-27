// components/dashboard/panels/health-panel.tsx
"use client"

import { Activity, Scale, Moon, Droplets, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PanelWrapper, EmptyState } from "./panel-wrapper"
import { METRIC_CONFIG } from "./constants"
import type { HealthMetric } from "@/types/custom"

interface HealthPanelProps {
  metrics: HealthMetric[]
  loading: boolean
  panelColor: string
  onAdd: () => void
  onEdit: (metric: HealthMetric) => void
  onDelete: (id: string) => void
}

const METRIC_ICONS: Record<string, React.ElementType> = {
  weight: Scale,
  sleep: Moon,
  water: Droplets,
  blood_pressure: Activity,
}

export function HealthPanel({
  metrics,
  loading,
  panelColor,
  onAdd,
  onEdit,
  onDelete,
}: HealthPanelProps) {
  return (
    <PanelWrapper
      title="健康數值"
      icon={Activity}
      panelColor={panelColor}
      loading={loading}
      onAdd={onAdd}
      addColor="bg-red-600 hover:bg-red-700"
    >
      {metrics.length === 0 ? (
        <EmptyState message="這天沒有健康記錄" />
      ) : (
        <div className="space-y-2">
          {metrics.map((metric) => {
            const metricType = metric.metric_type || "weight"
            const MetricIcon = METRIC_ICONS[metricType] || Activity
            const config = METRIC_CONFIG[metricType]

            return (
              <div key={metric.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <MetricIcon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{config?.label || metricType}</p>
                  {metric.note && <p className="text-sm text-gray-500">{metric.note}</p>}
                </div>
                <span className="font-semibold">
                  {metricType === "blood_pressure" && metric.value_secondary
                    ? `${metric.value_primary}/${metric.value_secondary}`
                    : metric.value_primary
                  } {config?.unit}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(metric)}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-red-500" 
                  onClick={() => onDelete(metric.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </PanelWrapper>
  )
}
