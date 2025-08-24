// Helper to calculate total price for a cart item
function calculateItemTotal(product, quantity, variations) {
  let basePrice = product.price || 0;
  // If variations is an array, sum their price
  let variationsTotal = 0;
  if (Array.isArray(variations)) {
    variationsTotal = variations.reduce((sum, v) => sum + (v.price || 0), 0);
  } else if (variations && typeof variations === 'object' && variations.price) {
    variationsTotal = variations.price;
  }
  return (basePrice + variationsTotal) * quantity;
}
import { supabase } from '../supabaseClient';
// Initial state for the app context
const initialState = {
  cart: [],
  // favorites supprimé
  searchQuery: '',
  selectedCategory: null,
  filters: {},
  isCartOpen: false,
  isQuoteModalOpen: false,
  selectedProduct: null,
  quoteHistory: [],
  userId: null,
  lastQuoteRequest: null,
  isAdmin: false,
  userEmail: null,
};

import React, { createContext, useReducer, useRef, useEffect, useContext } from 'react';
// Bloc dupliqué supprimé, le reducer existe déjà dans appReducer

// Typage du state global


function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER_ID':
      return { ...state, userId: action.payload };
    case 'SET_USER_EMAIL': {
      // Normalize email (trim + lowercase) to avoid false negatives
      const rawEmail = action.payload as string | null;
      const normalized = typeof rawEmail === 'string' ? rawEmail.toLowerCase().trim() : '';
      // Accept only the designated admin email
  const adminEmails = ['firassmrabett111@gmail.com', 'marwenyoussef2017@gmail.com'];
      const isAdmin = adminEmails.includes(normalized);
      return {
        ...state,
        userEmail: action.payload,
        isAdmin
      };
    }
    case 'SET_QUOTE_HISTORY':
      return { ...state, quoteHistory: action.payload };
    case 'SET_CART':
      return { ...state, cart: action.payload };
    case 'ADD_TO_CART': {
      const { product, quantity, variations } = action.payload;
      const existingItemIndex = state.cart.findIndex(
        item => 
          item.product.id === product.id && 
          JSON.stringify(item.selectedVariations) === JSON.stringify(variations)
      );
      if (existingItemIndex >= 0) {
        const updatedCart = [...state.cart];
        const newQuantity = updatedCart[existingItemIndex].quantity + quantity;
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: newQuantity,
          totalPrice: calculateItemTotal(product, newQuantity, variations)
        };
        return { ...state, cart: updatedCart };
      } else {
        const newItem = {
          product,
          quantity,
          selectedVariations: variations,
          totalPrice: calculateItemTotal(product, quantity, variations),
          addedAt: new Date().toISOString()
        };
        return { ...state, cart: [...state.cart, newItem] };
      }
    }
    case 'UPDATE_CART_ITEM': {
      const { productId, quantity, variations } = action.payload;
      const updatedCart = state.cart.map(item => {
        if (item.product.id === productId && JSON.stringify(item.selectedVariations) === JSON.stringify(variations)) {
          return {
            ...item,
            quantity,
            totalPrice: calculateItemTotal(item.product, quantity, variations)
          };
        }
        return item;
      });
      return { ...state, cart: updatedCart };
    }
    case 'REMOVE_FROM_CART': {
      // payload: { productId, variations }
      const { productId, variations } = action.payload;
      return {
        ...state,
        cart: state.cart.filter(item =>
          !(item.product.id === productId && JSON.stringify(item.selectedVariations) === JSON.stringify(variations))
        )
      };
    }
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'EXPLICIT_CLEAR_CART':
      return { ...state, cart: [] };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_CATEGORY':
      return { ...state, selectedCategory: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'TOGGLE_CART':
      return { ...state, isCartOpen: !state.isCartOpen };
    case 'TOGGLE_QUOTE_MODAL':
      return {
        ...state,
        isQuoteModalOpen: !state.isQuoteModalOpen,
        selectedProduct: action.payload || null,
        // Close cart when quote modal opens
        isCartOpen: state.isQuoteModalOpen ? state.isCartOpen : false
      };
    case 'CLOSE_QUOTE_MODAL':
      return {
        ...state,
        isQuoteModalOpen: false,
        selectedProduct: null
      };
    case 'SUBMIT_QUOTE': {
      const quoteWithDate = { ...action.payload, date: new Date().toISOString() };
      console.log('Quote request submitted:', quoteWithDate);
      return {
        ...state,
        isQuoteModalOpen: false,
        selectedProduct: null,
        quoteHistory: [...state.quoteHistory, quoteWithDate],
        lastQuoteRequest: quoteWithDate
      };
    }
    default:
      return state;
  }
}



// ...existing code...

const AppContext = createContext<AppContextType | null>(null);


function AppProvider({ children }) {
  // Initialiser les favoris depuis localStorage si non connecté
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    // favorites supprimé
  });
  const [userId, setUserId] = React.useState<string | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = React.useState(false);
  const isFirstLoad = useRef(true);
  const isSyncing = useRef(false);

  // Injecter userId dans le state pour accès global
  React.useEffect(() => {
    dispatch({ type: 'SET_USER_ID', payload: userId });
  }, [userId]);

  // Charger l'utilisateur connecté
  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
        dispatch({ type: 'SET_USER_EMAIL', payload: data.user.email });
        // Debug log: show normalized email and admin detection
        try {
          const raw = data.user.email;
          const norm = typeof raw === 'string' ? raw.toLowerCase().trim() : '';
           const adminEmails = ['firassmrabett111@gmail.com', 'marwenyoussef2017@gmail.com'];
          console.log('[Auth Debug] fetched user email:', raw, 'normalized:', norm, 'isAdmin:', adminEmails.includes(norm));
        } catch (e) {}
      } else {
        setUserId(null);
        dispatch({ type: 'SET_USER_EMAIL', payload: null });
      }
    }
    fetchUser();
    const { data: unsubscribe } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        dispatch({ type: 'SET_USER_EMAIL', payload: session.user.email });
        // Debug log on auth change
        try {
          const raw = session.user.email;
          const norm = typeof raw === 'string' ? raw.toLowerCase().trim() : '';
           const adminEmails = ['firassmrabett111@gmail.com', 'marwenyoussef2017@gmail.com'];
          console.log('[Auth Debug] auth state change email:', raw, 'normalized:', norm, 'isAdmin:', adminEmails.includes(norm));
        } catch (e) {}
      } else {
        setUserId(null);
        dispatch({ type: 'SET_USER_EMAIL', payload: null });
      }
    });
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, []);

  // Vider le panier, l'historique et les favoris locaux à la déconnexion (userId devient null)
  useEffect(() => {
    if (userId === null) {
      dispatch({ type: 'CLEAR_CART' });
      dispatch({ type: 'SET_QUOTE_HISTORY', payload: [] });
      // favoris supprimé
      try { localStorage.removeItem('favorites'); } catch {}
    }
  }, [userId]);


  // Charger le panier, l'historique et les favoris depuis Supabase à chaque connexion
  useEffect(() => {
    if (!userId) return;
    setIsLoadingUserData(true);
  // Clear UI state while we fetch, but avoid persisting the cleared state to Supabase
  // by setting `isSyncing` so the save effect skips writes while we are loading remote data.
  isSyncing.current = true;
  dispatch({ type: 'CLEAR_CART' });
  dispatch({ type: 'SET_QUOTE_HISTORY', payload: [] });
    // À la connexion, on efface les favoris locaux pour éviter mélange
    try { localStorage.removeItem('favorites'); } catch {}
    async function fetchUserData() {
      const { data: cartData, error: cartError } = await supabase.from('carts').select('items').eq('user_id', userId).single();
      const { data: quotesData, error: quotesError } = await supabase.from('quotes').select('quotes').eq('user_id', userId).single();
      if (cartError && cartError.code !== 'PGRST116') {
        // PGRST116 = No row found for single() in PostgREST / Supabase; ignore if no row
        console.error('Error fetching cart for user', userId, cartError);
      }
      if (quotesError && quotesError.code !== 'PGRST116') {
        console.error('Error fetching quotes for user', userId, quotesError);
      }

      // If there's no cart row yet, create an empty one so each user has their own cart record
      if (!cartData) {
        try {
          const { error: upsertErr } = await supabase.from('carts').upsert({ user_id: userId, items: [] }, { onConflict: 'user_id' });
          if (upsertErr) console.error('Error creating empty cart for user', userId, upsertErr);
        } catch (e) {
          console.error('Unexpected error creating empty cart for user', userId, e);
        }
      } else if (cartData?.items && Array.isArray(cartData.items)) {
        // Normalize items from DB and set the cart in one action to avoid mismatch in shapes
        const normalized = cartData.items.map(item => ({
          product: item.product,
          quantity: item.quantity || 1,
          selectedVariations: item.selectedVariations || null,
          totalPrice: item.totalPrice ?? (item.product?.price ? (item.product.price * (item.quantity || 1)) : 0),
          addedAt: item.addedAt || null
        }));
        dispatch({ type: 'SET_CART', payload: normalized });
      }

      if (!quotesData) {
        // create empty quotes row to keep schema consistent (optional)
        try {
          const { error: upsertQErr } = await supabase.from('quotes').upsert({ user_id: userId, quotes: [] }, { onConflict: 'user_id' });
          if (upsertQErr) console.error('Error creating empty quotes for user', userId, upsertQErr);
        } catch (e) {
          console.error('Unexpected error creating empty quotes for user', userId, e);
        }
      } else if (quotesData?.quotes && Array.isArray(quotesData.quotes) && quotesData.quotes.length > 0) {
        dispatch({ type: 'SET_QUOTE_HISTORY', payload: quotesData.quotes });
      }
  setIsLoadingUserData(false);
  // Finished syncing; allow save effect to persist future cart changes
  isSyncing.current = false;
    }
    fetchUserData();
    isFirstLoad.current = false;
  }, [userId]);


  // Sauvegarder le panier, l'historique et les favoris à chaque modification (sauf au premier chargement et sauf si userId est null)
  useEffect(() => {
    // Si connecté, sauvegarder dans Supabase. Skip persisting while syncing remote data.
    if (userId && !isFirstLoad.current && !isSyncing.current) {
      function serializeCart(cart) {
        return cart.map(item => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            image: item.product.image || '',
          },
          quantity: item.quantity,
          selectedVariations: item.selectedVariations,
          totalPrice: item.totalPrice,
          addedAt: item.addedAt || null
        }));
      }
      function serializeQuotes(quotes) {
        return quotes.map(q => ({
          ...q,
          date: q.date || null
        }));
      }
      async function saveUserData() {
        const safeCart = serializeCart(state.cart);
        const safeQuotes = serializeQuotes(state.quoteHistory);
        // Always persist the cart for the user, including an empty array.
        // Use onConflict to ensure we update the row identified by user_id.
        try {
            console.log('[Cart Sync] upserting cart for user', userId, 'items length', safeCart.length, 'time', new Date().toISOString());
            const { error: cartErr } = await supabase.from('carts').upsert({ user_id: userId, items: safeCart }, { onConflict: 'user_id' });
            if (cartErr) console.error('Error upserting cart for user', userId, cartErr);
            else console.log('[Cart Sync] upsert success for', userId, 'items length', safeCart.length, 'time', new Date().toISOString());
        } catch (e) {
          console.error('Unexpected error while upserting cart for user', userId, e);
        }

        try {
          if (safeQuotes.length > 0) {
            const { error: quotesErr } = await supabase.from('quotes').upsert({ user_id: userId, quotes: safeQuotes }, { onConflict: 'user_id' });
            if (quotesErr) console.error('Error upserting quotes for user', userId, quotesErr);
          }
        } catch (e) {
          console.error('Unexpected error while upserting quotes for user', userId, e);
        }
      }
      saveUserData();
    }
    // Si pas connecté, favoris supprimé du localStorage
  }, [state.cart, state.quoteHistory, userId]);

  // NE PAS vider le panier/l'historique à la déconnexion !

  return (
    <AppContext.Provider value={{ state, dispatch, isLoadingUserData }}>
      {children}
    </AppContext.Provider>
  );
}
// Ajoute une action pour remplacer l'historique de devis
// à placer dans appReducer
// case 'SET_QUOTE_HISTORY':
//   return { ...state, quoteHistory: action.payload };

function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export { AppProvider, useAppContext };