/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, ShoppingCart, LogIn, LogOut, User, Menu } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  currentGender: 'Women' | 'Men';
  onGenderChange: (gender: 'Women' | 'Men') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
  onCartClick: () => void;
  user: UserProfile | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleSidebar?: () => void;
}

export default function Header({
  currentGender,
  onGenderChange,
  searchQuery,
  onSearchChange,
  cartCount,
  onCartClick,
  user,
  onSignIn,
  onSignOut,
  onToggleSidebar
}: HeaderProps) {
  return (
    <header 
      id="storefront-header" 
      className="sticky top-0 right-0 left-0 bg-[#F8F9FA]/90 backdrop-blur-md flex items-center justify-between px-4 md:px-10 py-6 z-20 lg:ml-64 ml-0 h-24 gap-2 md:gap-4 border-b border-slate-100"
    >
      {/* Mobile Menu & Gender Filters (Tabs) */}
      <div id="header-gender-filters" className="flex items-center gap-2 bg-[#F2F2F5] p-1 rounded-[16px] w-fit">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl cursor-pointer"
            title="Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <button
          id="btn-gender-women"
          onClick={() => onGenderChange('Women')}
          className={`flex items-center gap-1.5 px-3 md:px-6 py-2.5 rounded-[12px] text-xs md:text-[14px] font-semibold transition-all duration-300 cursor-pointer ${
            currentGender === 'Women'
              ? 'bg-white text-[#1A1A1A] shadow-sm'
              : 'text-[#6C757D] hover:text-[#1A1A1A]'
          }`}
        >
          <span>👩🏼</span> <span className="hidden sm:inline">Mujer</span>
        </button>
        <button
          id="btn-gender-men"
          onClick={() => onGenderChange('Men')}
          className={`flex items-center gap-1.5 px-3 md:px-6 py-2.5 rounded-[12px] text-xs md:text-[14px] font-semibold transition-all duration-300 cursor-pointer ${
            currentGender === 'Men'
              ? 'bg-white text-[#1A1A1A] shadow-sm'
              : 'text-[#6C757D] hover:text-[#1A1A1A]'
          }`}
        >
          <span>👨🏻</span> <span className="hidden sm:inline">Hombre</span>
        </button>
      </div>

      {/* Modern Search Bar */}
      <div id="header-search-container" className="flex-1 max-w-xs md:max-w-lg mx-1 md:mx-10 relative">
        <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-[#6C757D]">
          <Search className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </span>
        <input
          id="search-input"
          type="text"
          placeholder="Buscar prendas, marcas..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 md:pl-12 pr-4 py-2 md:py-3 bg-white border-0 rounded-[16px] text-xs md:text-[14px] transition-all duration-300 text-[#1A1A1A] placeholder-[#6C757D] shadow-[0px_10px_30px_rgba(0,0,0,0.03)] focus:ring-2 focus:ring-gray-200 focus:outline-none"
        />
      </div>

      {/* Cart Actions & User Account Controls */}
      <div id="header-actions" className="flex items-center gap-2 md:gap-6">
        {/* Shopping Cart Trigger */}
        <button
          id="btn-open-cart"
          onClick={onCartClick}
          className="relative p-2.5 md:p-3.5 bg-white hover:bg-[#F2F2F5] rounded-[16px] text-[#1A1A1A] hover:text-black transition-all duration-200 cursor-pointer shadow-[0px_10px_30px_rgba(0,0,0,0.02)] border border-gray-150/30"
        >
          <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
          {cartCount > 0 && (
            <span 
              id="cart-badge" 
              className="absolute -top-1.5 -right-1.5 bg-[#E63946] text-white text-[9px] md:text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center border-2 border-[#F8F9FA]"
            >
              {cartCount}
            </span>
          )}
        </button>

        {/* User Auth Section */}
        {user ? (
          <div id="user-profile-menu" className="flex items-center gap-2 md:gap-4 pl-2 md:pl-4 border-l border-gray-200">
            {/* User Avatar */}
            <div className="flex items-center gap-2 md:gap-3">
              <div id="user-avatar" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#AEE5E5] border-2 border-white flex items-center justify-center text-[#1A1A1A] font-bold text-xs shadow-sm uppercase select-none">
                {user.nombre ? user.nombre.slice(0, 2) : <User className="w-4 h-4" />}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#1A1A1A] leading-tight">
                  {user.nombre}
                </span>
                <span className="text-[10px] text-[#6C757D] font-medium">
                  {user.esAdmin ? 'Administrador' : 'Cliente'}
                </span>
              </div>
            </div>

            {/* Logout Trigger */}
            <button
              id="btn-logout"
              onClick={onSignOut}
              title="Cerrar Sesión"
              className="p-2 md:p-2.5 bg-white hover:bg-red-50 text-[#6C757D] hover:text-red-500 rounded-[12px] transition-all duration-200 cursor-pointer shadow-sm border border-gray-100"
            >
              <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>
        ) : (
          <button
            id="btn-login"
            onClick={onSignIn}
            className="flex items-center gap-1.5 px-3 md:px-6 py-2 md:py-2.5 bg-[#1A1A1A] hover:bg-black text-white rounded-[16px] text-xs md:text-[14px] font-semibold transition-all duration-300 shadow-md cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden xs:inline">Ingresar</span>
          </button>
        )}
      </div>
    </header>
  );
}
