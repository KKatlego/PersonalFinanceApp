// ============================================
// POTS PAGE
// ============================================

'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout'
import { PotCard, PotFormModal, AddMoneyModal, WithdrawModal } from '@/components/pots'
import { Button } from '@/components/common'
import { Loading } from '@/components/common'
import { formatCurrency } from '@/lib/utils'
import { potsApi, ApiError } from '@/lib/api'

export default function PotsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editPot, setEditPot] = useState<{ id: string; name: string; target: number; theme: string } | null>(null)
  const [addMoneyPot, setAddMoneyPot] = useState<{ id: string; name: string; total: number; target: number; theme: string } | null>(null)
  const [withdrawPot, setWithdrawPot] = useState<{ id: string; name: string; total: number; target: number; theme: string } | null>(null)
  const [pots, setPots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPots()
  }, [])

  async function fetchPots() {
    try {
      setLoading(true)
      setError(null)
      const data = await potsApi.list()
      setPots(data)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to load pots')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddMoney = (id: string) => {
    const pot = pots.find((p) => p.id === id)
    if (pot) {
      setAddMoneyPot({
        id: pot.id,
        name: pot.name,
        total: Number(pot.total),
        target: Number(pot.target),
        theme: pot.theme,
      })
    }
  }

  const handleWithdraw = (id: string) => {
    const pot = pots.find((p) => p.id === id)
    if (pot) {
      setWithdrawPot({
        id: pot.id,
        name: pot.name,
        total: Number(pot.total),
        target: Number(pot.target),
        theme: pot.theme,
      })
    }
  }

  const handleEdit = (id: string) => {
    const pot = pots.find((p) => p.id === id)
    if (pot) {
      setEditPot({
        id: pot.id,
        name: pot.name,
        target: Number(pot.target),
        theme: pot.theme,
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pot? The money will be returned to your balance.')) {
      return
    }

    try {
      await potsApi.delete(id)
      fetchPots()
    } catch (err) {
      console.error('Failed to delete pot:', err)
    }
  }

  const handleCloseAllModals = () => {
    setIsAddModalOpen(false)
    setEditPot(null)
    setAddMoneyPot(null)
    setWithdrawPot(null)
  }

  const totalSaved = pots.reduce((sum, pot) => sum + Number(pot.total), 0)

  return (
    <DashboardLayout title="Pots">
      <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-secondary text-small">
              You have {formatCurrency(totalSaved)} saved across {pots.length} pot{pots.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>+ Add New Pot</Button>
        </div>

        {/* Content */}
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-secondary mb-4">{error}</p>
            <button
              onClick={fetchPots}
              className="text-primary hover:text-primary-dark transition"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Pots Grid */}
            {pots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pots.map((pot) => (
                  <PotCard
                    key={pot.id}
                    {...pot}
                    onAddMoney={handleAddMoney}
                    onWithdraw={handleWithdraw}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="card text-center py-12">
                <p className="text-secondary mb-4">No pots yet. Create your first savings pot!</p>
                <Button onClick={() => setIsAddModalOpen(true)}>Add New Pot</Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Pot Modal */}
      <PotFormModal
        isOpen={isAddModalOpen || editPot !== null}
        onClose={handleCloseAllModals}
        onSuccess={fetchPots}
        editData={editPot ?? undefined}
      />

      {/* Add Money Modal */}
      <AddMoneyModal
        isOpen={addMoneyPot !== null}
        onClose={handleCloseAllModals}
        onSuccess={fetchPots}
        pot={addMoneyPot}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={withdrawPot !== null}
        onClose={handleCloseAllModals}
        onSuccess={fetchPots}
        pot={withdrawPot}
      />
    </DashboardLayout>
  )
}
