import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  LayoutDashboard,
  BarChart3,
  Package,
  Users,
  DollarSign,
  Truck,
  Store,
  ShoppingCart,
  History,
  Heart,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ShoppingBag
} from 'lucide-react';

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Package, label: 'Inventory', path: '/admin/inventory' },
  { icon: Users, label: 'Customers', path: '/admin/customers' },
  { icon: DollarSign, label: 'Sales', path: '/admin/sales' },
  { icon: Truck, label: 'Suppliers', path: '/admin/suppliers' },
];

const customerMenuItems = [
  { icon: Store, label: 'Store', path: '/store' },
  { icon: ShoppingCart, label: 'Cart', path: '/cart' },
  { icon: History, label: 'Orders', path: '/orders' },
  { icon: Heart, label: 'Wishlist', path: '/wishlist' },
];

const DashboardLayout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = isAdmin ? adminMenuItems : customerMenuItems;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 p-6 ${!sidebarOpen && !mobile ? 'justify-center' : ''}`}>
        <ShoppingBag className="w-8 h-8 text-violet-500 flex-shrink-0" />
        <AnimatePresence>
          {(sidebarOpen || mobile) && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-xl font-bold font-['Outfit'] whitespace-nowrap overflow-hidden"
            >
              RetailIQ
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => mobile && setMobileMenuOpen(false)}
              className={`sidebar-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${isActive ? 'active bg-violet-500/20 text-white' : 'text-zinc-400 hover:text-white'}
                ${!sidebarOpen && !mobile ? 'justify-center' : ''}
              `}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {(sidebarOpen || mobile) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-zinc-800">
        {isAdmin && (
          <Link
            to="/store"
            className={`sidebar-item flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white mb-2
              ${!sidebarOpen && !mobile ? 'justify-center' : ''}
            `}
            data-testid="nav-view-store"
          >
            <Store className="w-5 h-5 flex-shrink-0" />
            {(sidebarOpen || mobile) && <span>View Store</span>}
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="hidden lg:flex flex-col bg-zinc-900/50 border-r border-zinc-800 fixed left-0 top-0 bottom-0 z-30"
      >
        <SidebarContent />
        
        {/* Collapse button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          data-testid="sidebar-toggle"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-zinc-900 z-50 lg:hidden"
            >
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-20'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[#09090b]/80 backdrop-blur-lg border-b border-zinc-800">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white"
              data-testid="mobile-menu-btn"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page title - shown on mobile */}
            <div className="lg:hidden flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-violet-500" />
              <span className="font-bold font-['Outfit']">RetailIQ</span>
            </div>

            {/* Spacer */}
            <div className="hidden lg:block" />

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 hover:bg-zinc-800" data-testid="user-menu-btn">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.picture} />
                    <AvatarFallback className="bg-violet-500/20 text-violet-400">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.name}</span>
                    <span className="text-xs text-zinc-500">{user?.email}</span>
                    <span className="text-xs text-violet-400 mt-1 capitalize">{user?.role}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-400" data-testid="logout-btn">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
