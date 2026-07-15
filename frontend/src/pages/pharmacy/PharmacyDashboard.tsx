import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyApi, patientsApi } from '../../api';
import { usePagination } from '../../hooks/usePagination';
import { Button, Input, Select, Card, Spinner, Alert, Badge } from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Package, FlaskConical, AlertTriangle, History } from 'lucide-react';

const drugSchema = z.object({
  name: z.string().min(2, 'Required'),
  genericName: z.string().optional(),
  manufacturer: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().min(1, 'Required'),
  stockQty: z.number().min(0).default(0),
  reorderLevel: z.number().min(0).default(5),
  unitPrice: z.number().min(0).default(0),
});

const dispenseSchema = z.object({
  patientId: z.string().min(1, 'Required'),
  items: z.array(z.object({
    itemId: z.string().min(1, 'Required'),
    quantity: z.number().min(1),
  })).min(1, 'At least 1 item is required'),
  notes: z.string().optional(),
});

type DrugFormValues = z.infer<typeof drugSchema>;
type DispenseFormValues = z.infer<typeof dispenseSchema>;

const PharmacyDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'catalog' | 'dispense' | 'lowstock'>('catalog');
  const [isAddDrugOpen, setIsAddDrugOpen] = useState(false);
  const [isDispenseOpen, setIsDispenseOpen] = useState(false);

  const { page, limit } = usePagination();

  // Fetch drug catalog
  const { data: catalog, isLoading: isCatalogLoading, error: catalogError } = useQuery({
    queryKey: ['pharmacy-items', page, limit],
    queryFn: () => pharmacyApi.findAllItems({ page, limit }),
  });

  // Fetch low stock items
  const { data: lowStock } = useQuery({
    queryKey: ['pharmacy-low-stock'],
    queryFn: pharmacyApi.getLowStock,
  });

  // Fetch dispensing logs
  const { data: logs, isLoading: isLogsLoading } = useQuery({
    queryKey: ['pharmacy-dispensing', page, limit],
    queryFn: () => pharmacyApi.findDispensing({ page, limit }),
    enabled: activeTab === 'dispense',
  });

  // Fetch patients for dispensing select
  const { data: patients } = useQuery({
    queryKey: ['patients-all-pharmacy'],
    queryFn: () => patientsApi.findAll({ limit: 100 }),
  });

  // Catalog item form
  const { register: drugReg, handleSubmit: drugSubmit, reset: drugReset, formState: { errors: drugErrors } } = useForm<any>({
    resolver: zodResolver(drugSchema),
    defaultValues: { stockQty: 0, reorderLevel: 10, unitPrice: 0 }
  });

  const addDrugMutation = useMutation({
    mutationFn: pharmacyApi.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-items'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-low-stock'] });
      setIsAddDrugOpen(false);
      drugReset();
    },
  });

  const onDrugSubmit = (values: any) => {
    addDrugMutation.mutate(values);
  };

  // Dispense Form
  const { register: dispenseReg, control: dispenseControl, handleSubmit: dispenseSubmit, reset: dispenseReset, formState: { errors: dispenseErrors } } = useForm<any>({
    resolver: zodResolver(dispenseSchema),
    defaultValues: { items: [{ itemId: '', quantity: 1 }] }
  });

  const { fields, append, remove } = useFieldArray({
    control: dispenseControl,
    name: 'items'
  });

  const dispenseMutation = useMutation({
    mutationFn: pharmacyApi.dispense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-items'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-dispensing'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-low-stock'] });
      setIsDispenseOpen(false);
      dispenseReset();
    },
  });

  const onDispenseSubmit = (values: any) => {
    dispenseMutation.mutate(values);
  };

  const patientOptions = (patients?.data || []).map((p: any) => ({ value: p._id, label: `${p.firstName} ${p.lastName} (${p.mrn})` }));
  patientOptions.unshift({ value: '', label: 'Select Patient' });

  const drugOptions = (catalog?.data || []).map((item: any) => ({ value: item._id, label: `${item.name} (${item.stockQty} left)` }));
  drugOptions.unshift({ value: '', label: 'Select Medicine' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy Operations</h1>
          <p className="text-sm text-gray-500 font-semibold font-sans">Dispense prescriptions, configure stock levels, and review alert logs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsDispenseOpen(true)} className="flex items-center gap-1.5 font-bold border-yellow-300 text-yellow-700 hover:bg-yellow-50">
            <FlaskConical className="h-4 w-4" /> Dispense Drugs
          </Button>
          <Button onClick={() => setIsAddDrugOpen(true)} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Add Medicine
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b pb-px">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors focus:outline-none ${
            activeTab === 'catalog'
              ? 'border-primary-500 text-primary-600 font-bold'
              : 'border-transparent text-gray-450 hover:text-gray-700'
          }`}
        >
          Drug Catalog
        </button>
        <button
          onClick={() => setActiveTab('dispense')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors focus:outline-none ${
            activeTab === 'dispense'
              ? 'border-primary-500 text-primary-600 font-bold'
              : 'border-transparent text-gray-450 hover:text-gray-700'
          }`}
        >
          Dispensing logs
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

      {activeTab === 'catalog' && (
        <>
          {isCatalogLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : catalogError ? (
            <Alert variant="danger">Failed to load catalog: {catalogError.message}</Alert>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full text-left border-collapse text-sm text-gray-700">
                <thead>
                  <tr className="bg-gray-55 border-b border-gray-150 text-xs font-bold uppercase text-gray-500 tracking-wider">
                    <th className="px-6 py-4">Medicine Name</th>
                    <th className="px-6 py-4">Generic Formula</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4">Available Qty</th>
                    <th className="px-6 py-4">Unit Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold">
                  {catalog?.data?.map((item: any) => (
                    <tr key={item._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 font-medium text-gray-500">{item.genericName || '—'}</td>
                      <td className="px-6 py-4 font-medium text-gray-600">{item.category || '—'}</td>
                      <td className="px-6 py-4 font-mono text-xs">{item.unit}</td>
                      <td className="px-6 py-4">
                        <span className={item.stockQty <= item.reorderLevel ? 'text-amber-600 font-bold' : 'text-gray-900'}>
                          {item.stockQty}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">₹{item.unitPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}

      {activeTab === 'dispense' && (
        <>
          {isLogsLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full text-left border-collapse text-sm text-gray-700">
                <thead>
                  <tr className="bg-gray-55 border-b border-gray-150 text-xs font-bold uppercase text-gray-500 tracking-wider">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Dispensed By</th>
                    <th className="px-6 py-4">Items Dispensed</th>
                    <th className="px-6 py-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold">
                  {logs?.data?.map((log: any) => (
                    <tr key={log._id}>
                      <td className="px-6 py-4 font-medium text-gray-500">
                        {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {log.patientId?.firstName} {log.patientId?.lastName} ({log.patientId?.mrn})
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {log.dispensedBy?.firstName} {log.dispensedBy?.lastName}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        {log.items?.map((item: any, idx: number) => (
                          <div key={idx}>{item.itemId?.name} x {item.quantity} ({item.itemId?.unit})</div>
                        ))}
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-medium">{log.notes || '—'}</td>
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
            <h3 className="font-bold text-gray-800 text-lg">System Stock Replenishment Warnings</h3>
          </div>
          {lowStock && lowStock.length > 0 ? (
            <div className="space-y-3">
              {lowStock.map((item: any) => (
                <div key={item._id} className="flex justify-between items-center bg-amber-50/50 p-4 border border-amber-100 rounded-xl">
                  <div>
                    <span className="font-bold text-gray-900 block">{item.name}</span>
                    <span className="text-xs text-gray-400 font-bold block">Formula: {item.genericName || 'Generic formula'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 font-bold block">Current Stock: <span className="text-amber-700 font-extrabold">{item.stockQty} {item.unit}</span></span>
                    <span className="text-xs text-gray-400 font-medium">Reorder Alert Trigger: {item.reorderLevel} {item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400 font-semibold border border-dashed rounded-xl bg-gray-50">
              All pharmacy inventory quantities are within target ranges.
            </div>
          )}
        </Card>
      )}

      {/* Add Drug Modal */}
      <Modal
        isOpen={isAddDrugOpen}
        onClose={() => {
          setIsAddDrugOpen(false);
          drugReset();
        }}
        title="Add Drug to Catalog"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddDrugOpen(false)}>Cancel</Button>
            <Button onClick={drugSubmit(onDrugSubmit)} loading={addDrugMutation.isPending}>Add Medicine</Button>
          </>
        }
      >
        <form className="space-y-4">
          {addDrugMutation.isError && (
            <Alert variant="danger">{(addDrugMutation.error as Error).message}</Alert>
          )}
          <Input label="Medicine Brand Name" required {...drugReg('name')} error={drugErrors.name?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Generic Formula" {...drugReg('genericName')} />
            <Input label="Manufacturer" {...drugReg('manufacturer')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category / Class" placeholder="e.g. Antibiotic" {...drugReg('category')} />
            <Input label="Unit" placeholder="e.g. tablet, vial, ml" required {...drugReg('unit')} error={drugErrors.unit?.message} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Initial Stock" type="number" {...drugReg('stockQty', { valueAsNumber: true })} />
            <Input label="Reorder Level" type="number" {...drugReg('reorderLevel', { valueAsNumber: true })} />
            <Input label="Unit Selling Price (₹)" type="number" {...drugReg('unitPrice', { valueAsNumber: true })} />
          </div>
        </form>
      </Modal>

      {/* Dispense Modal */}
      <Modal
        isOpen={isDispenseOpen}
        onClose={() => {
          setIsDispenseOpen(false);
          dispenseReset();
        }}
        title="Dispense Medicine"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDispenseOpen(false)}>Cancel</Button>
            <Button onClick={dispenseSubmit(onDispenseSubmit)} loading={dispenseMutation.isPending}>Record Dispensing</Button>
          </>
        }
      >
        <form className="space-y-4">
          {dispenseMutation.isError && (
            <Alert variant="danger">{(dispenseMutation.error as Error).message}</Alert>
          )}
          <Select label="Select Patient File" required options={patientOptions} {...dispenseReg('patientId')} error={dispenseErrors.patientId?.message} />
          
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            <label className="text-sm font-semibold text-gray-700 block">Dispense Items</label>
            {fields.map((field, index) => (
              <div key={field.id} className="p-3 border border-gray-150 rounded-lg grid grid-cols-12 gap-2 bg-gray-50 items-end relative">
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="absolute -top-1 right-2 text-xs font-bold text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                )}
                <div className="col-span-8">
                  <Select label="Medicine" required options={drugOptions} {...dispenseReg(`items.${index}.itemId` as const)} error={(dispenseErrors.items as any)?.[index]?.itemId?.message} />
                </div>
                <div className="col-span-4">
                  <Input label="Qty" type="number" required {...dispenseReg(`items.${index}.quantity` as const, { valueAsNumber: true })} error={(dispenseErrors.items as any)?.[index]?.quantity?.message} />
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ itemId: '', quantity: 1 })}
            className="w-full font-bold"
          >
            + Add Another Medicine
          </Button>

          <Input label="Dispensing Remarks" placeholder="e.g. Provided directions" {...dispenseReg('notes')} />
        </form>
      </Modal>
    </div>
  );
};

export default PharmacyDashboard;
