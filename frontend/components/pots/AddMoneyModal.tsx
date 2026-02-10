'use client'

import { useState, useEffect } from 'react'
import { Modal, Button, Input } from '@/components/common'
import { potsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

interface AddMoneyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  pot: { id: string; name: string; total: number; target: number; theme: string } | null
}

export function AddMoneyModal({ isOpen, onClose, onSuccess, pot }: AddMoneyModalProps) {
  const [amount, setAmount] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => { if (isOpen) { setAmount(''); setErrors({}) } }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) { setErrors({ amount: 'Please enter a valid amount' }); return }
    try {
      setIsSubmitting(true)
      await potsApi.addMoney(pot!.id, amountNum)
      onSuccess?.()
      onClose()
    } catch (err: any) { setErrors({ form: err?.message || 'Failed to add money' }) }
    finally { setIsSubmitting(false) }
  }

  if (!pot) return null
  const newTotal = pot.total + (parseFloat(amount) || 0)
  const remainingToTarget = Math.max(0, pot.target - newTotal)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Money to ${pot.name}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-sidebar rounded-card">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: pot.theme }} />
          <div className="flex-1">
            <p className="text-body font-semibold text-primary">{pot.name}</p>
            <p className="text-small text-secondary">Current: {formatCurrency(pot.total)} / Target: {formatCurrency(pot.target)}</p>
          </div>
        </div>
        <div>
          <label className="block text-body font-medium text-primary mb-2">Amount to Add</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">$</span>
            <Input id="amount" type="number" step="0.01" min="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} className="pl-8" autoFocus />
          </div>
        </div>
        {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
          <div className="p-4 bg-sidebar rounded-card space-y-2">
            <p className="text-small text-secondary">Preview</p>
            <div className="flex justify-between"><span className="text-body text-primary">New Total</span><span className="text-body font-semibold text-primary">{formatCurrency(newTotal)}</span></div>
            <div className="flex justify-between"><span className="text-body text-primary">Remaining to Target</span><span className="text-body font-semibold text-accent">{formatCurrency(remainingToTarget)}</span></div>
            {newTotal >= pot.target && <div className="pt-2 border-t border-border"><p className="text-small font-semibold text-accent">Target Reached!</p></div>}
          </div>
        )}
        <div>
          <p className="text-small text-secondary mb-2">Quick Amount</p>
          <div className="flex gap-2">
            {['10', '25', '50', '100'].map((v) => <button key={v} type="button" onClick={() => setAmount(v)} className="px-4 py-2 text-small font-medium text-primary border border-border rounded-card hover:bg-sidebar transition-colors">${v}</button>)}
          </div>
        </div>
        {errors.form && <div className="p-3 bg-danger/10 border border-danger rounded-card"><p className="text-small text-danger">{errors.form}</p></div>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Money'}</Button>
        </div>
      </form>
    </Modal>
  )
}
