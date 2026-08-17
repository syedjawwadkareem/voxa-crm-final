'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, ShoppingCart } from 'lucide-react';
import { CompanyHeader } from '@/components/company/CompanyHeader';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { ordersApi } from '@/lib/api';
import type { Order, CreateOrderPayload, OrderItem } from '@/lib/types';

export default function CompanyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Create Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateOrderPayload>({
    customerDetails: { name: '', email: '', phone: '' },
    shippingDetails: { address: '', city: '', state: '', zip: '', country: '', method: '' },
    items: [],
    pricing: { subtotal: 0, tax: 0, shippingCost: 0, totalAmount: 0 },
    status: 'pending',
    paymentStatus: 'pending'
  });
  const [newItem, setNewItem] = useState<OrderItem>({ productName: '', sku: '', quantity: 1, unitPrice: 0 });
  const [createLoading, setCreateLoading] = useState(false);

  // View Modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Order | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(`${type}::${msg}`);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ordersApi.list();
      setOrders(res.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await ordersApi.create(createForm);
      showToast('Order created successfully');
      setCreateOpen(false);
      setCreateForm({
        customerDetails: { name: '', email: '', phone: '' },
        shippingDetails: { address: '', city: '', state: '', zip: '', country: '', method: '' },
        items: [],
        pricing: { subtotal: 0, tax: 0, shippingCost: 0, totalAmount: 0 },
        status: 'pending',
        paymentStatus: 'pending'
      });
      fetchOrders();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to create order', 'error');
    } finally {
      setCreateLoading(false);
    }
  }

  const addItem = () => {
    if (!newItem.productName || newItem.quantity <= 0 || newItem.unitPrice < 0) return;
    setCreateForm(prev => {
      const items = [...(prev.items || []), newItem];
      return { ...prev, items };
    });
    setNewItem({ productName: '', sku: '', quantity: 1, unitPrice: 0 });
  };

  const removeItem = (idx: number) => {
    setCreateForm(prev => {
      const items = [...(prev.items || [])];
      items.splice(idx, 1);
      return { ...prev, items };
    });
  };

  const filtered = orders.filter((o) =>
    o.customerDetails.name.toLowerCase().includes(search.toLowerCase()) ||
    o._id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <CompanyHeader
        title="Order Management"
        subtitle="Manage customer orders, shipments, and payments"
        actions={
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={15} strokeWidth={2} /> New Order
          </button>
        }
      />

      <div className="px-6 py-6 max-w-7xl mx-auto">
        {error && <div className="chip chip-red mb-4 px-3 py-2 rounded-lg">{error}</div>}

        {/* Search */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input max-w-xs pl-8"
              placeholder="Search by customer name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-slate-400 text-sm">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        <div className="card">
          <div className="table-wrap">
            {loading ? (
              <div className="px-4 py-12 text-center text-slate-400 text-sm">Loading orders...</div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-slate-400 flex flex-col items-center">
                <ShoppingCart size={40} className="mb-4 text-slate-300" />
                <span className="text-sm">{search ? 'No orders match your search.' : 'No orders found. Create your first order!'}</span>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Name</th>
                    <th>Total Amount</th>
                    <th>Order Status</th>
                    <th>Payment</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o._id}>
                      <td className="font-mono text-xs text-slate-500">{o._id.substring(0, 8)}...</td>
                      <td className="font-medium text-slate-800">{o.customerDetails.name}</td>
                      <td className="font-semibold text-slate-700">${o.pricing.totalAmount?.toFixed(2)}</td>
                      <td><StatusBadge status={o.status as any} /></td>
                      <td className="capitalize text-slate-600">{o.paymentStatus}</td>
                      <td className="text-slate-400 text-xs">
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <button
                          className="btn-outline text-xs inline-flex items-center gap-1"
                          onClick={() => { setViewTarget(o); setViewOpen(true); }}
                        >
                          <Eye size={11} strokeWidth={2} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* View Modal */}
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Order Details" maxWidth="600px">
        {viewTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Customer</div>
                <div className="text-sm font-medium">{viewTarget.customerDetails.name}</div>
                <div className="text-sm text-slate-500">{viewTarget.customerDetails.email || 'No email'}</div>
                <div className="text-sm text-slate-500">{viewTarget.customerDetails.phone || 'No phone'}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Shipping</div>
                <div className="text-sm">{viewTarget.shippingDetails?.address || 'N/A'}</div>
                <div className="text-sm text-slate-500">
                  {viewTarget.shippingDetails?.city} {viewTarget.shippingDetails?.state} {viewTarget.shippingDetails?.zip}
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Items</div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Item</th>
                      <th className="px-3 py-2 text-right font-medium text-slate-500">Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-slate-500">Price</th>
                      <th className="px-3 py-2 text-right font-medium text-slate-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewTarget.items?.map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{item.productName} <span className="text-xs text-slate-400">({item.sku})</span></td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Order" maxWidth="600px">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 border-b pb-1">Customer Details</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium">Full Name *</label>
                  <input className="input mt-1" required value={createForm.customerDetails.name} onChange={(e) => setCreateForm({ ...createForm, customerDetails: { ...createForm.customerDetails, name: e.target.value } })} />
                </div>
                <div>
                  <label className="text-xs font-medium">Email</label>
                  <input className="input mt-1" type="email" value={createForm.customerDetails.email} onChange={(e) => setCreateForm({ ...createForm, customerDetails: { ...createForm.customerDetails, email: e.target.value } })} />
                </div>
                <div>
                  <label className="text-xs font-medium">Phone</label>
                  <input className="input mt-1" value={createForm.customerDetails.phone} onChange={(e) => setCreateForm({ ...createForm, customerDetails: { ...createForm.customerDetails, phone: e.target.value } })} />
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 mt-2 border-b pb-1">Order Items</div>
              {createForm.items?.map((item, i) => (
                <div key={i} className="flex gap-2 items-center mb-2 text-sm bg-slate-50 p-2 rounded">
                  <div className="flex-1 font-medium">{item.productName}</div>
                  <div className="w-16 text-center">x{item.quantity}</div>
                  <div className="w-20 text-right">${item.unitPrice.toFixed(2)}</div>
                  <button type="button" onClick={() => removeItem(i)} className="text-red-500 text-xs px-2 hover:underline">Remove</button>
                </div>
              ))}
              <div className="flex gap-2 items-end mt-2">
                <div className="flex-1">
                  <label className="text-xs font-medium">Product Name</label>
                  <input className="input mt-1 text-sm" value={newItem.productName} onChange={(e) => setNewItem({ ...newItem, productName: e.target.value })} />
                </div>
                <div className="w-20">
                  <label className="text-xs font-medium">Qty</label>
                  <input className="input mt-1 text-sm" type="number" min={1} value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })} />
                </div>
                <div className="w-24">
                  <label className="text-xs font-medium">Price ($)</label>
                  <input className="input mt-1 text-sm" type="number" min={0} step="0.01" value={newItem.unitPrice} onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })} />
                </div>
                <button type="button" className="btn-secondary py-2" onClick={addItem}>Add</button>
              </div>
            </div>
          </div>
          
          <button type="submit" disabled={createLoading || !createForm.items?.length} className="w-full btn-primary py-2.5 mt-4">
            {createLoading ? 'Saving...' : 'Create Order'}
          </button>
        </form>
      </Modal>

      {/* Toast */}
      {toast && (() => {
        const isError = toast.startsWith('error::');
        const isSuccess = toast.startsWith('success::');
        const msg = toast.includes('::') ? toast.split('::').slice(1).join('::') : toast;
        return (
          <div className={`toast show ${isError ? 'toast-error' : isSuccess ? 'toast-success' : ''}`}>
            {isError ? '✕ ' : isSuccess ? '✓ ' : ''}{msg}
          </div>
        );
      })()}
    </div>
  );
}
