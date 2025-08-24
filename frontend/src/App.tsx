import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { DataProvider } from './context/DataContext';
import Header from './components/Header';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './components/HomePage';
import ProductListing from './components/ProductListing';
import ProductModal from './components/ProductModal';
import Cart from './components/Cart';
import QuoteModal from './components/QuoteModal';
import Footer from './components/Footer';
import { Product } from './types';
import { useAppContext } from './context/AppContext';
import { supabase } from './supabaseClient';
import { Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import MonCompte from './components/MonCompte';
import QuoteSuccessPage from './components/QuoteSuccessPage';
import AdminPage from './components/AdminPage';

function AppContent() {
  // Auth check
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  React.useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      setIsAuthenticated(!!data?.user);
      setAuthChecked(true);
    }
    checkAuth();
  }, []);

  // Suppression de la vérification globale : la page principale s'affiche toujours
  const { state, dispatch } = useAppContext();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
    // Close cart when product modal opens
    if (state.isCartOpen) {
      dispatch({ type: 'TOGGLE_CART' });
    }
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
  };

  const isHomePage = !state.searchQuery && !state.selectedCategory;

  return (
    <div className="min-h-screen flex flex-col">
    <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={isHomePage ? <HomePage onProductClick={handleProductClick} /> : <ProductListing onProductClick={handleProductClick} />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/mon-compte" element={<MonCompte />} />
          <Route path="/quote-success" element={<QuoteSuccessPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={handleCloseProductModal}
        product={selectedProduct as Product}
      />
      <Cart />
      <QuoteModal />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AppProvider>
  );
}