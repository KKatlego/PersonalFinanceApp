'use client'

import { useState, useEffect } from 'react'
import { Modal, Button, Input, Select } from '@/components/common'
import { budgetsApi } from '@/lib/api'
import { CATEGORIES, THEME_COLORS } from '@/lib/constants'
import type { Category } from '@/types'
import { cn } from '@/lib/utils'

interface BudgetFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  editData?: {
    id: string
    category: Category
    maximum: number
    theme: string
  }
}

export function BudgetFormModal({ isOpen, onClose, onSuccess, editData }: BudgetFormModalProps) {
  const [category, setCategory] = useState<Category>(editData?.category || 'Entertainment')
  const [maximum, setMaximum] = useState(editData?.maximum?.toString() || '')
  const [theme, setTheme] = useState(editData?.theme || THEME_COLORS[0])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setCategory(editData?.category || 'Entertainment')
      setMaximum(editData?.maximum?.toString() || '')
      setTheme(editData?.theme || THEME_COLORS[0])
      setErrors({})
    }
  }, [isOpen, editData])

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}
    if (!maximum || parseFloat(maximum) <= 0) {
      newErrors.maximum = 'Please enter a valid maximum budget amount'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      const data = { category, maximum: parseFloat(maximum), theme }
      if (editData?.id) {
        await budgetsApi.update(editData.id, data)
      } else {
        await budgetsApi.create(data)
      }
      onSuccess?.()
      onClose()
    } catch (err: any) {
      setErrors({ form: err?.message || 'Failed to save budget' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableCategories = CATEGORIES.map((cat) => ({ value: cat.value, label: cat.label }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData?.id ? 'Edit Budget' : 'Add New Budget'} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-body font-medium text-primary mb-2">Category</label>
          <Select id="category" value={category} onChange={(e) => setCategory(e.target.value as Category)} options={availableCategories} error={errors.category} disabled={!!editData?.id} />
        </div>
        <div>
          <label className="block text-body font-medium text-primary mb-2">Maximum Budget</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">$</span>
            <Input id="maximum" type="number" step="0.01" min="0.01" placeholder="0.00" value={maximum} onChange={(e) => setMaximum(e.target.value)} error={errors.maximum} className="pl-8" autoFocus={!editData?.id} />
          </div>
        </div>
        <div>
          <label className="block text-body font-medium text-primary mb-3">Theme Color</label>
          <div className="flex flex-wrap gap-3">
            {THEME_COLORS.map((color) => (
              <button key={color} type="button" onClick={() => setTheme(color)} className={cn('w-10 h-10 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary', theme === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : '')} style={{ backgroundColor: color }} aria-label={`Select ${color} theme`}>
                {theme === color && <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </button>
            ))}
          </div>
        </div>
        {errors.form && <div className="p-3 bg-danger/10 border border-danger rounded-card"><p className="text-small text-danger">{errors.form}</p></div>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : editData?.id ? 'Save Changes' : 'Add Budget'}</Button>
        </div>
      </form>
    </Modal>
  )
}
