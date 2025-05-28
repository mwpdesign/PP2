import React from 'react';
import { 
  LayoutGrid, Users, Phone, FileText, Settings, 
  Bell, Shield, BarChart3, LogOut 
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutGrid },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'IVR Management', href: '/admin/ivr', icon: Phone },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Compliance', href: '/admin/compliance', icon: Shield },
  { name: 'Documents', href: '/admin/documents', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => router.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-slate-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">
                Healthcare IVR
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md
                    ${
                      isActive(item.href)
                        ? 'bg-slate-50 text-slate-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 ${
                      isActive(item.href)
                        ? 'text-slate-600'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-600">
                    {user?.firstName?.[0]}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="ml-auto flex items-center justify-center h-8 w-8 rounded-full text-gray-400 hover:text-gray-500"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout; 