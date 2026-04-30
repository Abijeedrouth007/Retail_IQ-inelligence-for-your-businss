import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
  Search,
  Phone,
  Mail,
  Users,
  Loader2
} from 'lucide-react';
import { formatCurrency, useConfig } from '../../contexts/ConfigContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const CustomersPage = () => {
  const { currencySymbol } = useConfig();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${API_URL}/api/analytics/customers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-['Outfit']">Customers</h1>
          <p className="text-zinc-400 mt-1">View and manage your customer base</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Total Customers</p>
                    <p className="text-2xl font-bold font-['JetBrains_Mono']">{customers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Active Customers</p>
                    <p className="text-2xl font-bold font-['JetBrains_Mono']">
                      {customers.filter(c => c.order_count > 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Avg. Spent</p>
                    <p className="text-2xl font-bold font-['JetBrains_Mono']">
                      {formatCurrency(customers.length > 0 
                        ? (customers.reduce((acc, c) => acc + c.total_spent, 0) / customers.length)
                        : 0, currencySymbol)
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search customers by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-zinc-950/50 border-zinc-800"
                data-testid="search-customers-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <Users className="w-12 h-12 mb-4" />
                <p>No customers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="data-table">
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400">Customer</TableHead>
                      <TableHead className="text-zinc-400">Email</TableHead>
                      <TableHead className="text-zinc-400">Phone</TableHead>
                      <TableHead className="text-zinc-400">Orders</TableHead>
                      <TableHead className="text-zinc-400">Total Spent</TableHead>
                      <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.user_id} className="border-zinc-800">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-violet-500/20 text-violet-400">
                                {customer.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{customer.name || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-400">{customer.email}</TableCell>
                        <TableCell className="text-zinc-400">{customer.phone || '-'}</TableCell>
                        <TableCell className="font-['JetBrains_Mono']">{customer.order_count}</TableCell>
                        <TableCell className="font-['JetBrains_Mono'] text-teal-400">
                          {formatCurrency(customer.total_spent, currencySymbol)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {customer.phone && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => window.open(`tel:${customer.phone}`)}
                                className="hover:bg-zinc-800"
                                data-testid={`call-customer-${customer.user_id}`}
                              >
                                <Phone className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => window.open(`mailto:${customer.email}`)}
                              className="hover:bg-zinc-800"
                              data-testid={`email-customer-${customer.user_id}`}
                            >
                              <Mail className="w-4 h-4" />
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

export default CustomersPage;
