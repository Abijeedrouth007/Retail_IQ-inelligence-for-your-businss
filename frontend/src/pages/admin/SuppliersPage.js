import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Truck,
  Loader2,
  Phone,
  Mail
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });

  const fetchSuppliers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/suppliers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const url = editingSupplier 
        ? `${API_URL}/api/suppliers/${editingSupplier.supplier_id}`
        : `${API_URL}/api/suppliers`;
      
      const res = await fetch(url, {
        method: editingSupplier ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(editingSupplier ? 'Supplier updated!' : 'Supplier added!');
        setDialogOpen(false);
        resetForm();
        fetchSuppliers();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to save supplier');
      }
    } catch (error) {
      toast.error('Failed to save supplier');
    }
  };

  const handleDelete = async (supplierId) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/suppliers/${supplierId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Supplier deleted!');
        fetchSuppliers();
      }
    } catch (error) {
      toast.error('Failed to delete supplier');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
    setEditingSupplier(null);
  };

  const openEditDialog = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      notes: supplier.notes || ''
    });
    setDialogOpen(true);
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-['Outfit']">Suppliers</h1>
            <p className="text-zinc-400 mt-1">Manage your product suppliers</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="add-supplier-btn">
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label>Supplier Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-zinc-950/50 border-zinc-800"
                    required
                    data-testid="supplier-name-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-zinc-950/50 border-zinc-800"
                      data-testid="supplier-email-input"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-zinc-950/50 border-zinc-800"
                      data-testid="supplier-phone-input"
                    />
                  </div>
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="bg-zinc-950/50 border-zinc-800"
                    data-testid="supplier-address-input"
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-zinc-950/50 border-zinc-800"
                    rows={3}
                    data-testid="supplier-notes-input"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="btn-primary" data-testid="save-supplier-btn">
                    {editingSupplier ? 'Update' : 'Add'} Supplier
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search suppliers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-zinc-950/50 border-zinc-800"
                data-testid="search-suppliers-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Table */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <Truck className="w-12 h-12 mb-4" />
                <p>No suppliers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="data-table">
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400">Name</TableHead>
                      <TableHead className="text-zinc-400">Email</TableHead>
                      <TableHead className="text-zinc-400">Phone</TableHead>
                      <TableHead className="text-zinc-400">Address</TableHead>
                      <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.supplier_id} className="border-zinc-800">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                              <Truck className="w-5 h-5 text-violet-400" />
                            </div>
                            <span className="font-medium">{supplier.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-400">{supplier.email || '-'}</TableCell>
                        <TableCell className="text-zinc-400">{supplier.phone || '-'}</TableCell>
                        <TableCell className="text-zinc-400 max-w-[200px] truncate">
                          {supplier.address || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {supplier.phone && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => window.open(`tel:${supplier.phone}`)}
                                className="hover:bg-zinc-800"
                              >
                                <Phone className="w-4 h-4" />
                              </Button>
                            )}
                            {supplier.email && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => window.open(`mailto:${supplier.email}`)}
                                className="hover:bg-zinc-800"
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditDialog(supplier)}
                              className="hover:bg-zinc-800"
                              data-testid={`edit-supplier-${supplier.supplier_id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(supplier.supplier_id)}
                              className="hover:bg-red-500/20 text-red-400"
                              data-testid={`delete-supplier-${supplier.supplier_id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SuppliersPage;
