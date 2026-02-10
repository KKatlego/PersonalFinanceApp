'use client'

import { useState, useEffect } from 'react'
import { Modal, Button, Input } from '@/components/common'
import { potsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  pot: { id: string; name: string; total: number; target: number; theme: string } | null
}

export function WithdrawModal({ isOpen, onClose, onSuccess, pot }: WithdrawModalProps) {
  const [amount, setAmount] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => { if (isOpen) { setAmount(''); setErrors({}) } }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) { setErrors({ amount: 'Please enter a valid amount' }); return }
    if (amountNum > pot!.total) { setErrors({ amount: `Cannot withdraw more than ${formatCurrency(pot!.total)}` }); return }
    try {
      setIsSubmitting(true)
      await potsApi.withdraw(pot!.id, amountNum)
      onSuccess?.()
      onClose()
    } catch (err: any) { setErrors({ form: err?.message || 'Failed to withdraw' }) }
    finally { setIsSubmitting(false) }
  }

  if (!pot) return null
  const withdrawAmount = parseFloat(amount) || 0
  const remaining = Math.max(0, pot.total - withdrawAmount)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Withdraw from ${pot.name}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-sidebar rounded-card">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: pot.theme }} />
          <div className="flex-1">
            <p className="text-body font-semibold text-primary">{pot.name}</p>
            <p className="text-small text-secondary">Available: {formatCurrency(pot.total)}</p>
          </div>
        </div>
        <div>
          <label className="block text-body font-medium text-primary mb-2">Amount to Withdraw</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">$</span>
            <Input id="amount" type="number" step="0.01" min="0.01" max={pot.total} placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} className="pl-8" autoFocus />
          </div>
        </div>
        <button type="button" onClick={() => setAmount(pot.total.toString())} className="text-small text-accent hover:text-accent-hover font-medium">Withdraw All ({formatCurrency(pot.total)})</button>
        {amount && !isNaN(withdrawAmount) && withdrawAmount > 0 && (
          <div className="p-4 bg-sidebar rounded-card space-y-2">
            <p className="text-small text-secondary">Preview</p>
            <div className="flex justify-between"><span className="text-body text-primary">Withdrawing</span><span className="text-body font-semibold text-danger">-{formatCurrency(withdrawAmount)}</span></div>
            <div className="flex justify-between"><span className="text-body text-primary">Remaining in Pot</span><span className="text-body font-semibold text-primary">{formatCurrency(remaining)}</span></div>
          </div>
        )}
        {withdrawAmount > 0 && withdrawAmount >= pot.total && <div className="p-3 bg-warning/10 border border-warning rounded-card"><p className="text-small text-warning">This will empty your pot. Are you sure?</p></div>}
        {errors.form && <div className="p-3 bg-danger/10 border border-danger rounded-card"><p className="text-small text-danger">{errors.form}</p></div>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" variant="danger" className="flex-1" disabled={isSubmitting || !amount || parseFloat(amount) <= 0}>{isSubmitting ? 'Withdrawing...' : 'Withdraw'}</Button>
        </div>
      </form>
    </Modal>
  )
}
