'use client'

import { useState, useEffect } from 'react'
import { Modal, Button, Input } from '@/components/common'
import { potsApi } from '@/lib/api'
import { THEME_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface PotFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  editData?: { id: string; name: string; target: number; theme: string }
}

export function PotFormModal({ isOpen, onClose, onSuccess, editData }: PotFormModalProps) {
  const [name, setName] = useState(editData?.name || '')
  const [target, setTarget] = useState(editData?.target?.toString() || '')
  const [theme, setTheme] = useState(editData?.theme || THEME_COLORS[0])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(editData?.name || '')
      setTarget(editData?.target?.toString() || '')
      setTheme(editData?.theme || THEME_COLORS[0])
      setErrors({})
    }
  }, [isOpen, editData])

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}
    if (!name || name.trim().length === 0) newErrors.name = 'Please enter a pot name'
    if (!target || parseFloat(target) <= 0) newErrors.target = 'Please enter a valid target amount'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      const data = { name: name.trim(), target: parseFloat(target), theme }
      if (editData?.id) await potsApi.update(editData.id, data)
      else await potsApi.create(data)
      onSuccess?.()
      onClose()
    } catch (err: any) {
      setErrors({ form: err?.message || 'Failed to save pot' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData?.id ? 'Edit Pot' : 'Add New Pot'} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-body font-medium text-primary mb-2">Pot Name</label>
          <Input id="name" type="text" placeholder="e.g., Emergency Fund, Vacation" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={50} autoFocus={!editData?.id} />
          <p className="text-small text-secondary mt-1">Give your savings pot a name</p>
        </div>
        <div>
          <label className="block text-body font-medium text-primary mb-2">Target Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">$</span>
            <Input id="target" type="number" step="0.01" min="0.01" placeholder="0.00" value={target} onChange={(e) => setTarget(e.target.value)} error={errors.target} className="pl-8" />
          </div>
          <p className="text-small text-secondary mt-1">Set your savings goal</p>
        </div>
        <div>
          <label className="block text-body font-medium text-primary mb-3">Theme Color</label>
          <div className="flex flex-wrap gap-3">
            {THEME_COLORS.map((color) => (
              <button key={color} type="button" onClick={() => setTheme(color)} className={cn('w-10 h-10 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary', theme === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : '')} style={{ backgroundColor: color }}>
                {theme === color && <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </button>
            ))}
          </div>
        </div>
        {errors.form && <div className="p-3 bg-danger/10 border border-danger rounded-card"><p className="text-small text-danger">{errors.form}</p></div>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : editData?.id ? 'Save Changes' : 'Add Pot'}</Button>
        </div>
      </form>
    </Modal>
  )
}
