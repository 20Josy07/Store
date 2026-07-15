/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Sparkles, 
  Shirt, 
  Footprints, 
  Watch, 
  Dumbbell, 
  ShoppingBag, 
  HelpCircle,
  Settings,
  X
} from 'lucide-react';

interface SidebarProps {
  currentCategory: string;
  onCategoryChange: (category: string) => void;
  isAdminUser: boolean;
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  currentCategory,
  onCategoryChange,
  isAdminUser,
  currentPage,
  onNavigate,
  isOpenOnMobile = false,
  onCloseMobile
}: SidebarProps) {
  
  const exploreItems = [
    { label: "Novedades", value: "New in", icon: Sparkles },
    { label: "Ropa", value: "Clothing", icon: Shirt },
    { label: "Calzado", value: "Shoes", icon: Footprints },
    { label: "Accesorios", value: "Accessories", icon: Watch },
    { label: "Deporte", value: "ActiveWear", icon: Dumbbell },
    { label: "Outlet", value: "Outlet", icon: ShoppingBag },
  ];

  const handleItemClick = (value: string) => {
    onCategoryChange(value);
    onNavigate('home');
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenOnMobile && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside 
        id="storefront-sidebar" 
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-100 flex flex-col p-8 z-40 transition-transform duration-300 overflow-y-auto ${
          isOpenOnMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ boxShadow: '0px 10px 30px rgba(0,0,0,0.01)' }}
      >
        <div className="flex flex-col flex-1">
          <div>
            {/* Logo Section */}
            <div 
              id="sidebar-logo" 
              onClick={() => { onNavigate('home'); onCategoryChange('New in'); if (onCloseMobile) onCloseMobile(); }}
              className="cursor-pointer mb-12 flex items-center justify-between gap-2"
            >
              <span className="font-sans font-bold text-2xl tracking-tighter text-[#1A1A1A] select-none">
                Store
              </span>
              {onCloseMobile && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onCloseMobile(); }}
                  className="lg:hidden p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Explore Navigation Group */}
            <div id="sidebar-explore-group">
              <p className="text-[11px] font-semibold text-[#6C757D] uppercase tracking-wider mb-6 px-1">
                Explorar
              </p>
              <nav className="space-y-2">
                {exploreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === 'home' && currentCategory === item.value;
                  return (
                    <button
                      key={item.value}
                      id={`btn-category-${item.value.toLowerCase().replace(' ', '-')}`}
                      onClick={() => handleItemClick(item.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-[14px] font-semibold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-[#F2F2F5] text-[#1A1A1A]'
                          : 'text-[#6C757D] hover:text-[#1A1A1A] hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#1A1A1A]' : 'text-gray-400 group-hover:text-gray-900'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Admin Option */}
            {isAdminUser && (
              <div id="sidebar-admin-group" className="mt-8 border-t border-gray-100 pt-4">
                <p className="text-[11px] font-semibold text-[#6C757D] uppercase tracking-wider mb-2 px-1">
                  Administración
                </p>
                <button
                  id="btn-nav-admin"
                  onClick={() => { onNavigate('admin'); if (onCloseMobile) onCloseMobile(); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-[14px] font-semibold transition-all duration-200 cursor-pointer ${
                    currentPage === 'admin'
                      ? 'bg-red-50 text-[#E63946]'
                      : 'text-[#6C757D] hover:text-[#1A1A1A] hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-4 h-4 text-red-400" />
                  Portal de Admin
                </button>
              </div>
            )}
          </div>

          {/* Sidebar Footer Help Center */}
          <div id="sidebar-help-center" className="mt-auto pt-8">
            <button 
              id="btn-help-center"
              onClick={() => alert("Centro de Ayuda: ¡El chat en vivo está activo! ¿Cómo podemos ayudarte hoy? Puedes escribirnos a support@store.com")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-[14px] font-semibold text-[#6C757D] hover:text-[#1A1A1A] hover:bg-gray-50 transition-all duration-200 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-gray-400" />
              Centro de Ayuda
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
