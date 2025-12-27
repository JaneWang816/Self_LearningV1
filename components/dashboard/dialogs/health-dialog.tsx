// components/dashboard/dialogs/health-dialog.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface HealthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: Record<string, any>
  setFormData: (data: Record<string, any>) => void
  onSave: () => void
  saving: boolean
  dateLabel: string
  isEdit: boolean
}

export function HealthDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSave,
  saving,
  dateLabel,
  isEdit,
}: HealthDialogProps) {
  const metricType = formData.metric_type || "weight"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "編輯健康數值" : "新增健康數值"}</DialogTitle>
          <DialogDescription>{dateLabel} 的記錄</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>類型 *</Label>
            <Select 
              value={metricType} 
              onValueChange={(v) => setFormData({ ...formData, metric_type: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weight">體重 (kg)</SelectItem>
                <SelectItem value="sleep">睡眠 (小時)</SelectItem>
                <SelectItem value="water">飲水 (ml)</SelectItem>
                <SelectItem value="blood_pressure">血壓 (mmHg)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{metricType === "blood_pressure" ? "收縮壓 *" : "數值 *"}</Label>
              <Input 
                type="number" 
                step="0.1" 
                value={formData.value_primary || ""} 
                onChange={(e) => setFormData({ ...formData, value_primary: e.target.value })} 
              />
            </div>
            {metricType === "blood_pressure" && (
              <div className="space-y-2">
                <Label>舒張壓 *</Label>
                <Input 
                  type="number" 
                  value={formData.value_secondary || ""} 
                  onChange={(e) => setFormData({ ...formData, value_secondary: e.target.value })} 
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>備註</Label>
            <Input 
              value={formData.note || ""} 
              onChange={(e) => setFormData({ ...formData, note: e.target.value })} 
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button 
            onClick={onSave} 
            disabled={
              saving || 
              !formData.value_primary || 
              (metricType === "blood_pressure" && !formData.value_secondary)
            }
          >
            {saving ? "儲存中..." : "儲存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
