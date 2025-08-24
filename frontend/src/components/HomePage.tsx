import React from 'react';
import { ArrowRight, Zap, Shield, Truck, HeadphonesIcon } from 'lucide-react';
import ProductCard from './ProductCard';
import { useAppContext } from '../context/AppContext';
import { useDataContext } from '../context/DataContext';
import { Product } from '../types';
import { useNavigate } from 'react-router-dom';

interface HomePageProps {
  onProductClick: (product: Product) => void;
}

export default function HomePage({ onProductClick }: HomePageProps) {
  const { state, dispatch } = useAppContext();
  const { categories, products } = useDataContext();
  const newArrivalsRef = React.useRef<HTMLDivElement | null>(null);
  const isCartEmpty = !state?.cart || state.cart.length === 0;
  // Only show admin/custom categories on homepage and header
  const customCategories = categories.filter((c: any) => c.isCustom);
  // Pagination for New Arrivals: show only admin-created (custom) products 8 per page,
  // sorted by created_at desc
  const pageSize = 8;
  const [currentPage, setCurrentPage] = React.useState(1);
  const adminProducts = (products || []).filter((p: any) => p.isCustom);
  const sortedAdminProducts = adminProducts.slice().sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const pageCount = Math.max(1, Math.ceil((sortedAdminProducts || []).length / pageSize));
  const paginatedProducts = sortedAdminProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId: string) => {
    dispatch({ type: 'SET_CATEGORY', payload: categoryId });
    // Force scroll to top because the app swaps HomePage -> ProductListing
    // without changing the route pathname, so ScrollToTop won't fire.
    try {
      window.scrollTo({ top: 0, left: 0 });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  };

  const handleRequestQuote = () => {
    // Check if user is authenticated
    if (!state || !state.userId) {
      navigate('/login');
      return;
    }
    dispatch({ type: 'TOGGLE_QUOTE_MODAL', payload: null });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Votre partenaire en équipements électriques industriels
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Bedouielec Transformateurs vous propose une gamme complète de matériel électrique 
                industriel de haute qualité. Solutions professionnelles pour tous vos projets.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => {
                    dispatch({ type: 'SET_CATEGORY', payload: null });
                    // Scroll smoothly to the New Arrivals section
                    newArrivalsRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Découvrir nos produits</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={handleRequestQuote}
                  disabled={isCartEmpty}
                  title={isCartEmpty ? 'Ajoutez au moins un produit au panier pour demander un devis' : undefined}
                  className={`border border-white text-white px-8 py-3 rounded-lg transition-colors ${isCartEmpty ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:text-blue-900'}`}
                >
                  Demander un devis
                </button>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://electricien-78-services.fr/wp-content/uploads/2023/01/electricien-paris-service-.jpg"
                alt="Industrial electrical equipment"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white ">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8 justify-items-center">
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Expertise technique</h3>
              <p className="text-gray-600">Plus de 20 ans d'expérience dans l'électricité industrielle</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Qualité garantie</h3>
              <p className="text-gray-600">Produits certifiés conformes aux normes internationales</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <HeadphonesIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Support technique</h3>
              <p className="text-gray-600">Accompagnement et conseil pour vos projets</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Nos catégories</h2>
            <p className="text-xl text-gray-600">Découvrez notre gamme complète d'équipements électriques industriels</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {customCategories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
              >
                <div className="relative flex items-center justify-center h-48 bg-gray-50 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="max-h-40 w-auto object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                    {category.productCount > 0 && (
                      <p className="text-sm opacity-90">
                        {category.productCount} produit{category.productCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1">
                    <span>Voir les produits</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

  {/* Featured Products removed - showing only admin new arrivals below */}

  {/* New Arrivals */}
  <section ref={newArrivalsRef} className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Nouveautés</h2>
            <p className="text-xl text-gray-600">Les derniers produits ajoutés à notre catalogue</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={onProductClick}
              />
            ))}
          </div>
          {/* Pagination controls */}
          <div className="flex items-center justify-center mt-6 space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-500' : 'bg-white border'}`}
            >
              Précédent
            </button>
            {Array.from({ length: pageCount }).map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700'}`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
              disabled={currentPage === pageCount}
              className={`px-3 py-1 rounded ${currentPage === pageCount ? 'bg-gray-200 text-gray-500' : 'bg-white border'}`}
            >
              Suivant
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Besoin d'un devis personnalisé ?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Notre équipe d'experts est à votre disposition pour vous conseiller et établir un devis sur mesure.
          </p>
          <button
            onClick={handleRequestQuote}
            disabled={isCartEmpty}
            title={isCartEmpty ? "Ajoutez au moins un produit au panier pour demander un devis" : undefined}
            className={`bg-orange-500 text-white px-8 py-3 rounded-lg transition-colors text-lg font-semibold ${isCartEmpty ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'}`}
          >
            Demander un devis 
          </button>
        </div>
      </section>
    </div>
  );
}
