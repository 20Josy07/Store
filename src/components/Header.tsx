/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, ShoppingCart, LogIn, LogOut, User } from 'lucide-react';
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
  onSignOut
}: HeaderProps) {
  return (
    <header 
      id="storefront-header" 
      className="sticky top-0 right-0 left-0 bg-[#F8F9FA]/90 backdrop-blur-md flex items-center justify-between px-10 py-6 z-20 ml-64 h-24"
    >
      {/* Gender Filters (Tabs) */}
      <div id="header-gender-filters" className="flex bg-[#F2F2F5] p-1 rounded-[16px] w-fit">
        <button
          id="btn-gender-women"
          onClick={() => onGenderChange('Women')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-[12px] text-[14px] font-semibold transition-all duration-300 cursor-pointer ${
            currentGender === 'Women'
              ? 'bg-white text-[#1A1A1A] shadow-sm'
              : 'text-[#6C757D] hover:text-[#1A1A1A]'
          }`}
        >
          <span>👩🏼</span> Women
        </button>
        <button
          id="btn-gender-men"
          onClick={() => onGenderChange('Men')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-[12px] text-[14px] font-semibold transition-all duration-300 cursor-pointer ${
            currentGender === 'Men'
              ? 'bg-white text-[#1A1A1A] shadow-sm'
              : 'text-[#6C757D] hover:text-[#1A1A1A]'
          }`}
        >
          <span>👨🏻</span> Men
        </button>
      </div>

      {/* Modern Search Bar */}
      <div id="header-search-container" className="flex-1 max-w-lg mx-10 relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6C757D]">
          <Search className="w-4 h-4" />
        </span>
        <input
          id="search-input"
          type="text"
          placeholder="Search For Items, Brands and Inspiration ..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border-0 rounded-[16px] text-[14px] transition-all duration-300 text-[#1A1A1A] placeholder-[#6C757D] shadow-[0px_10px_30px_rgba(0,0,0,0.03)] focus:ring-2 focus:ring-gray-200 focus:outline-none"
        />
      </div>

      {/* Cart Actions & User Account Controls */}
      <div id="header-actions" className="flex items-center gap-6">
        {/* Shopping Cart Trigger */}
        <button
          id="btn-open-cart"
          onClick={onCartClick}
          className="relative p-3.5 bg-white hover:bg-[#F2F2F5] rounded-[16px] text-[#1A1A1A] hover:text-black transition-all duration-200 cursor-pointer shadow-[0px_10px_30px_rgba(0,0,0,0.02)] border border-gray-150/30"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span 
              id="cart-badge" 
              className="absolute -top-1.5 -right-1.5 bg-[#E63946] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#F8F9FA]"
            >
              {cartCount}
            </span>
          )}
        </button>

        {/* User Auth Section */}
        {user ? (
          <div id="user-profile-menu" className="flex items-center gap-4 pl-4 border-l border-gray-200">
            {/* User Avatar */}
            <div className="flex items-center gap-3">
              <div id="user-avatar" className="w-10 h-10 rounded-full bg-[#AEE5E5] border-2 border-white flex items-center justify-center text-[#1A1A1A] font-bold text-xs shadow-sm uppercase select-none">
                {user.nombre ? user.nombre.slice(0, 2) : <User className="w-4 h-4" />}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#1A1A1A] leading-tight">
                  {user.nombre}
                </span>
                <span className="text-[10px] text-[#6C757D] font-medium">
                  {user.esAdmin ? 'Administrator' : 'Customer'}
                </span>
              </div>
            </div>

            {/* Logout Trigger */}
            <button
              id="btn-logout"
              onClick={onSignOut}
              title="Sign Out"
              className="p-2.5 bg-white hover:bg-red-50 text-[#6C757D] hover:text-red-500 rounded-[12px] transition-all duration-200 cursor-pointer shadow-sm border border-gray-100"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            id="btn-login"
            onClick={onSignIn}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1A1A1A] hover:bg-black text-white rounded-[16px] text-[14px] font-semibold transition-all duration-300 shadow-md cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Iniciar Sesión
          </button>
        )}
      </div>
    </header>
  );
}
