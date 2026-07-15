import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../../api';
import { usePagination } from '../../hooks/usePagination';
import { Button, Input, Select, Card, Spinner, Alert, Badge } from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Package, History, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { InventoryItem } from '../../types/api';

const itemSchema = z.object({
  name: z.string().min(2, 'Required'),
  sku: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().min(1, 'Required'),
  currentQty: z.number().min(0).default(0),
  reorderLevel: z.number().min(0).default(5),
  unitCost: z.number().min(0).default(0),
  location: z.string().optional(),
});

const txSchema = z.object({
  itemId: z.string().min(1, 'Required'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RETURN']),
  quantity: z.number().min(1, 'Must be at least 1'),
  reference: z.string().optional(),
});

type ItemFormValues = z.infer<typeof itemSchema>;
type TxFormValues = z.infer<typeof txSchema>;

const InventoryDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'stock' | 'tx' | 'lowstock'>('stock');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isTxOpen, setIsTxOpen] = useState(false);

  const { page, limit } = usePagination();

  // Fetch stock list
  const { data: stock, isLoading: isStockLoading, error: stockError } = useQuery({
    queryKey: ['inventory-items', page, limit],
    queryFn: () => inventoryApi.findAllItems({ page, limit }),
  });

  // Fetch low stock items
  const { data: lowStock } = useQuery({
    queryKey: ['inventory-low-stock'],
    queryFn: inventoryApi.getLowStock,
  });

  // Fetch transactions logs
  const { data: txs, isLoading: isTxsLoading } = useQuery({
    queryKey: ['inventory-transactions', page, limit],
    queryFn: () => inventoryApi.findTransactions({ page, limit }),
    enabled: activeTab === 'tx',
  });

  // Add Item form
  const { register: itemReg, handleSubmit: itemSubmit, reset: itemReset, formState: { errors: itemErrors } } = useForm<any>({
    resolver: zodResolver(itemSchema),
    defaultValues: { currentQty: 0, reorderLevel: 5, unitCost: 0 }
  });

  const addItemMutation = useMutation({
    mutationFn: inventoryApi.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-low-stock'] });
      setIsAddItemOpen(false);
      itemReset();
    },
  });

  const onItemSubmit = (values: any) => {
    addItemMutation.mutate(values);
  };

  // Transaction form
  const { register: txReg, handleSubmit: txSubmit, reset: txReset, formState: { errors: txErrors } } = useForm<any>({
    resolver: zodResolver(txSchema),
    defaultValues: { type: 'IN', quantity: 1 }
  });

  const txMutation = useMutation({
    mutationFn: inventoryApi.recordTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-low-stock'] });
      setIsTxOpen(false);
      txReset();
    },
  });

  const onTxSubmit = (values: any) => {
    txMutation.mutate(values);
  };

  const itemOptions = (stock?.data || []).map((item: any) => ({ value: item._id, label: `${item.name} (${item.currentQty} left)` }));
  itemOptions.unshift({ value: '', label: 'Select Item' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Registry</h1>
          <p className="text-sm text-gray-500 font-semibold font-sans">Manage hospital non-pharmaceutical supplies, record transactions, and alerts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsTxOpen(true)} className="flex items-center gap-1.5 font-bold border-yellow-300 text-yellow-700 hover:bg-yellow-50">
            <ArrowUpDown className="h-4 w-4" /> Record Movement
          </Button>
          <Button onClick={() => setIsAddItemOpen(true)} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Add Supply Item
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b pb-px">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors focus:outline-none ${
            activeTab === 'stock'
              ? 'border-primary-500 text-primary-600 font-bold'
              : 'border-transparent text-gray-450 hover:text-gray-700'
          }`}
        >
          Stock Directory
        </button>
        <button
          onClick={() => setActiveTab('tx')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors focus:outline-none ${
            activeTab === 'tx'
              ? 'border-primary-500 text-primary-600 font-bold'
              : 'border-transparent text-gray-450 hover:text-gray-700'
          }`}
        >
          Transaction History
        </button>
        <button
          onClick={() => setActiveTab('lowstock')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors focus:outline-none flex items-center gap-1.5 ${
            activeTab === 'lowstock'
              ? 'border-primary-500 text-primary-600 font-bold'
              : 'border-transparent text-gray-450 hover:text-gray-700'
          }`}
        >
          Low Stock Alerts
          {lowStock && lowStock.length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-amber-200">
              {lowStock.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'stock' && (
        <>
          {isStockLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : stockError ? (
            <Alert variant="danger">Failed to load stock list: {stockError.message}</Alert>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full text-left border-collapse text-sm text-gray-700">
                <thead>
                  <tr className="bg-gray-55 border-b border-gray-150 text-xs font-bold uppercase text-gray-500 tracking-wider">
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4">SKU Code</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4">Available Qty</th>
                    <th className="px-6 py-4">Storage Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold">
                  {stock?.data?.map((item: any) => (
                    <tr key={item._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">{item.sku || '—'}</td>
                      <td className="px-6 py-4 font-medium text-gray-655">{item.category || '—'}</td>
                      <td className="px-6 py-4 font-mono text-xs">{item.unit}</td>
                      <td className="px-6 py-4">
                        <span className={item.currentQty <= item.reorderLevel ? 'text-amber-600 font-bold' : 'text-gray-900'}>
                          {item.currentQty}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-500">{item.location || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}

      {activeTab === 'tx' && (
        <>
          {isTxsLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full text-left border-collapse text-sm text-gray-700">
                <thead>
                  <tr className="bg-gray-55 border-b border-gray-150 text-xs font-bold uppercase text-gray-500 tracking-wider">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Qty</th>
                    <th className="px-6 py-4">Reference</th>
                    <th className="px-6 py-4">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold">
                  {txs?.data?.map((tx: any) => (
                    <tr key={tx._id}>
                      <td className="px-6 py-4 font-medium text-gray-500">
                        {new Date(tx.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">{tx.itemId?.name}</td>
                      <td className="px-6 py-4">
                        <Badge variant={tx.type === 'IN' || tx.type === 'RETURN' ? 'success' : 'danger'}>
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-bold">{tx.quantity} {tx.itemId?.unit}</td>
                      <td className="px-6 py-4 text-gray-400 font-medium">{tx.reference || '—'}</td>
                      <td className="px-6 py-4 font-medium">
                        {tx.performedBy?.firstName} {tx.performedBy?.lastName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}

      {activeTab === 'lowstock' && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-bold text-gray-800 text-lg">Hospital Supplies Replenishment Warnings</h3>
          </div>
          {lowStock && lowStock.length > 0 ? (
            <div className="space-y-3">
              {lowStock.map((item: any) => (
                <div key={item._id} className="flex justify-between items-center bg-amber-50/50 p-4 border border-amber-100 rounded-xl">
                  <div>
                    <span className="font-bold text-gray-900 block">{item.name}</span>
                    <span className="text-xs text-gray-400 font-bold block">Location: {item.location || 'Central Store'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-550 font-bold block">Current Quantity: <span className="text-amber-700 font-extrabold">{item.currentQty} {item.unit}</span></span>
                    <span className="text-xs text-gray-400 font-medium">Reorder Alert Trigger: {item.reorderLevel} {item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400 font-semibold border border-dashed rounded-xl bg-gray-50">
              All supply quantities are within safe inventory levels.
            </div>
          )}
        </Card>
      )}

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddItemOpen}
        onClose={() => {
          setIsAddItemOpen(false);
          itemReset();
        }}
        title="Add Supply Item"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>Cancel</Button>
            <Button onClick={itemSubmit(onItemSubmit)} loading={addItemMutation.isPending}>Add Item</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="Supply Item Name" required {...itemReg('name')} error={itemErrors.name?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU / Barcode Code" {...itemReg('sku')} />
            <Input label="Category" placeholder="e.g. Syringe, Glove" {...itemReg('category')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Storage location" placeholder="e.g. Ward 4 cabinet" {...itemReg('location')} />
            <Input label="Unit" placeholder="e.g. box, piece, pack" required {...itemReg('unit')} error={itemErrors.unit?.message} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Initial Qty" type="number" {...itemReg('currentQty', { valueAsNumber: true })} />
            <Input label="Reorder Level" type="number" {...itemReg('reorderLevel', { valueAsNumber: true })} />
            <Input label="Unit Cost (₹)" type="number" {...itemReg('unitCost', { valueAsNumber: true })} />
          </div>
        </form>
      </Modal>

      {/* Record Movement Modal */}
      <Modal
        isOpen={isTxOpen}
        onClose={() => {
          setIsTxOpen(false);
          txReset();
        }}
        title="Record Stock Movement"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsTxOpen(false)}>Cancel</Button>
            <Button onClick={txSubmit(onTxSubmit)} loading={txMutation.isPending}>Submit Transaction</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Select label="Select Inventory Item" required options={itemOptions} {...txReg('itemId')} error={txErrors.itemId?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Movement Type"
              required
              options={[
                { value: 'IN', label: 'Stock IN (Purchase/Add)' },
                { value: 'OUT', label: 'Stock OUT (Usage/Reduce)' },
                { value: 'ADJUSTMENT', label: 'ADJUSTMENT (Overwrite Qty)' },
                { value: 'RETURN', label: 'RETURN (Return to store)' },
              ]}
              {...txReg('type')}
              error={txErrors.type?.message}
            />
            <Input label="Quantity" type="number" required {...txReg('quantity', { valueAsNumber: true })} error={txErrors.quantity?.message} />
          </div>
          <Input label="Reference / Reason Note" placeholder="e.g. PO-1234, quarterly count" {...txReg('reference')} />
        </form>
      </Modal>
    </div>
  );
};

export default InventoryDashboard;
