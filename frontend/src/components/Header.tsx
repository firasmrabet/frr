import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useDataContext } from '../context/DataContext';
import { supabase } from '../supabaseClient';
import { FiPhone, FiMail, FiSearch, FiUser, FiShoppingCart, FiMenu, FiX } from 'react-icons/fi';

function Header() {
  const { categories, products } = useDataContext();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();

  React.useEffect(() => {
    const refreshAuth = async () => {
      const { data } = await supabase.auth.getUser();
      setIsAuthenticated(!!data?.user);
    };
    refreshAuth();
    const { data: unsubscribe } = supabase.auth.onAuthStateChange(() => {
      refreshAuth();
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);

  const customCategories = categories.filter((c: any) => c.isCustom);

  const handleSearch = (e) => {
    e.preventDefault();
    if (suggestions.length > 0 && showSuggestions) {
      handleSuggestionSelect(suggestions[activeSuggestion]);
      return;
    }
    launchSearch(searchInput);
  };

  const launchSearch = (inputRaw) => {
    const input = inputRaw.trim().toLowerCase();
    // Catégorie exacte (admin/custom only)
    const matchedCategory = customCategories.find((cat: any) =>
      cat.name.toLowerCase() === input || cat.id.toLowerCase() === input
    );
    if (matchedCategory) {
      dispatch({ type: 'SET_CATEGORY', payload: matchedCategory.id });
      dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
      navigate('/');
      setIsMenuOpen(false);
      setShowSuggestions(false);
      return;
    }
    // Produit exact
    const matchedProduct = products.find(prod =>
      prod.name.toLowerCase() === input || prod.id.toLowerCase() === input
    );
    if (matchedProduct) {
      // ensure we dispatch the category ID (admin products use category_id, static may use category name)
      const categoryId = matchedProduct.category_id || (
        categories.find(c => c.name === matchedProduct.category)?.id || null
      );
      dispatch({ type: 'SET_CATEGORY', payload: categoryId });
      dispatch({ type: 'SET_SEARCH_QUERY', payload: matchedProduct.name });
      navigate('/');
      setIsMenuOpen(false);
      setShowSuggestions(false);
      return;
    }
    // Recherche classique
    dispatch({ type: 'SET_SEARCH_QUERY', payload: inputRaw });
    dispatch({ type: 'SET_CATEGORY', payload: null });
    navigate('/');
    setIsMenuOpen(false);
    setShowSuggestions(false);
  };

  const handleSuggestionSelect = (suggestion) => {
    if (suggestion.type === 'category') {
      dispatch({ type: 'SET_CATEGORY', payload: suggestion.id });
      dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
      navigate('/');
    } else if (suggestion.type === 'product') {
      dispatch({ type: 'SET_CATEGORY', payload: suggestion.category });
      dispatch({ type: 'SET_SEARCH_QUERY', payload: suggestion.name });
      navigate('/');
    }
    setShowSuggestions(false);
    setIsMenuOpen(false);
    setSearchInput(suggestion.name);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (value.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    // Filtrer catégories et produits
    const inputLower = value.toLowerCase();
    // Only suggest admin/custom categories
    const catSuggestions = customCategories
      .filter((cat: any) => cat.name.toLowerCase().includes(inputLower) || cat.id.toLowerCase().includes(inputLower))
      .map((cat: any) => ({ type: 'category', id: cat.id, name: cat.name }));
    const prodSuggestions = products
      .filter(prod => prod.name.toLowerCase().includes(inputLower) || prod.id.toLowerCase().includes(inputLower))
      .map(prod => {
        const categoryId = (prod as any).category_id || (customCategories.find((c: any) => c.name === prod.category)?.id || null);
        return ({ type: 'product', id: prod.id, name: prod.name, category: categoryId });
      });
    const allSuggestions = [...catSuggestions, ...prodSuggestions].slice(0, 8);
    setSuggestions(allSuggestions);
    setShowSuggestions(allSuggestions.length > 0);
    setActiveSuggestion(0);
  };

  const handleInputKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      setActiveSuggestion((prev) => (prev + 1) % suggestions.length);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setActiveSuggestion((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      handleSuggestionSelect(suggestions[activeSuggestion]);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const totalCartItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Top bar */}
      <div className="bg-slate-800 text-white text-sm py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FiPhone className="w-4 h-4" />
              <a href="tel:+21629493780" className="hover:underline">+216 29493780</a>
            </div>
            <div className="flex items-center space-x-2 max-w-[220px] min-w-0">
              <FiMail className="w-4 h-4" />
              <a href="mailto:marwenyoussef2017@gmail.com" className="hover:underline truncate block min-w-0">
                support@bedouielectransormateur.com
              </a>
            </div>
          </div>
          <div className="md:hidden w-full" />
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between py-4 gap-4 relative">
            {/* Logo */}
      <div className="flex items-center flex-shrink-0 pr-16 md:pr-0">
              <button
        className="text-xl sm:text-2xl font-bold text-blue-900 focus:outline-none"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                onClick={() => {
                  navigate('/');
                  dispatch({ type: 'SET_CATEGORY', payload: null });
                  setIsMenuOpen(false);
                }}
              >
        Bedouielec
        <span className="block text-sm font-normal text-slate-600 hidden sm:block">Transformateurs</span>
              </button>
            </div>

            {/* Search bar */}
            <div className="flex-1 max-w-2xl mx-8 hidden md:block min-w-0">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Rechercher des produits, catégories..."
                  value={searchInput}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="off"
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600"
                >
                  <FiSearch className="w-5 h-5" />
                </button>
                {showSuggestions && (
                  <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-auto">
                    {suggestions.map((sugg, idx) => (
                      <li
                        key={sugg.type + '-' + sugg.id}
                        className={`px-4 py-2 cursor-pointer flex items-center justify-between ${idx === activeSuggestion ? 'bg-blue-100' : ''}`}
                        onMouseDown={() => handleSuggestionSelect(sugg)}
                      >
                        <span>
                          {sugg.name}
                          {sugg.type === 'category' && <span className="ml-2 text-xs text-gray-500">Catégorie</span>}
                          {sugg.type === 'product' && <span className="ml-2 text-xs text-gray-500">Produit</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </form>
            </div>

      {/* Right section */}
      <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0 min-w-0 absolute right-4 top-4 md:static z-50">
              <button
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600"
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                  } else {
                    navigate('/mon-compte');
                  }
                }}
              >
                <FiUser className="w-5 h-5" />
        <span className="hover:underline ml-1 text-sm hidden md:inline">Mon compte</span>
              </button>

              {/* Admin button - only visible for admin */}
              {state.isAdmin && (
                <button
                  className="hidden md:flex items-center space-x-1 text-orange-600 hover:text-orange-700 font-medium"
                  onClick={() => navigate('/admin')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="hover:underline ml-1">Admin</span>
                </button>
              )}

              {/* Debug info - remove this after testing */}
              {isAuthenticated && (
                <div className="hidden md:block text-xs text-gray-500 max-w-[140px] truncate min-w-0">
                  Email: {state.userEmail}
                </div>
              )}

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    window.location.href = '/login';
                  } else {
                    dispatch({ type: 'TOGGLE_CART' });
                  }
                }}
                className="relative flex items-center space-x-1 text-gray-700 hover:text-blue-600"
              >
                <FiShoppingCart className="w-6 h-6" />
                <span className="hidden md:inline">Panier</span>
                {totalCartItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalCartItems}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-gray-700"
              >
                {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          <div className={`md:hidden pb-4 ${isMenuOpen ? 'hidden' : ''}`}>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                <FiSearch className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Navigation */}
        <nav className="border-t border-gray-200">
          <div className="container mx-auto px-4">
          <div className={`${isMenuOpen ? 'block' : 'hidden'} md:block`}>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-2 overflow-x-auto">
                {/* Mobile action panel (shown when menu open) */}
                {isMenuOpen && (
                  <div className="md:hidden w-full bg-white p-4 rounded mb-2 shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <FiUser className="w-6 h-6 text-gray-700" />
                        <button onClick={() => { setIsMenuOpen(false); navigate(isAuthenticated ? '/mon-compte' : '/login'); }} className="text-gray-800 font-medium">Mon compte</button>
                      </div>
                      {state.isAdmin && (
                        <button onClick={() => { setIsMenuOpen(false); navigate('/admin'); }} className="text-orange-600 font-medium">Administrateur</button>
                      )}
                    </div>
                    {isAuthenticated && (
                      <div className="text-xs text-gray-500 truncate">Courriel : {state.userEmail}</div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => {
                    navigate('/');
                    dispatch({ type: 'SET_CATEGORY', payload: null });
                    setIsMenuOpen(false);
                  }}
                  className={`py-2 px-3 text-sm font-medium transition-colors ${
                    state.selectedCategory === null
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Tous les produits
                </button>
                {customCategories.map((category: any) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      navigate('/');
                      dispatch({ type: 'SET_CATEGORY', payload: category.id });
                      setIsMenuOpen(false);
                    }}
                    className={`py-2 px-3 text-sm font-medium transition-colors ${
                      state.selectedCategory === category.id
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}

export default Header;
