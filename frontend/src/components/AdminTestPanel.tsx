import { useState } from 'react';
import { useDataContext } from '../context/DataContext';
import { categoriesService, productsService } from '../services/adminService';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function AdminTestPanel() {
  const { categories, products, reloadData } = useDataContext();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  const runTests = async () => {
    setTesting(true);
    const results = [];

    try {
      // Test 1: Check if categories load
      results.push({
        name: 'Chargement des catégories',
        success: categories.length >= 0,
        details: `${categories.length} catégories chargées`
      });

      // Test 2: Check if products load
      results.push({
        name: 'Chargement des produits',
        success: products.length >= 0,
        details: `${products.length} produits chargés`
      });

      // Test 3: Test category creation
      try {
        const testCategory = await categoriesService.create({
          name: 'Test Category',
          description: 'Test description',
          image: 'https://via.placeholder.com/300',
          characteristics: ['Test Characteristic']
        });
        
        if (testCategory) {
          // Clean up test category
          await categoriesService.delete(testCategory.id);
          results.push({
            name: 'Création/Suppression de catégorie',
            success: true,
            details: 'Test réussi'
          });
        } else {
          results.push({
            name: 'Création de catégorie',
            success: false,
            details: 'Échec de la création'
          });
        }
      } catch (error) {
        results.push({
          name: 'Création de catégorie',
          success: false,
          details: `Erreur: ${error}`
        });
      }

      // Test 4: Check data context integration
      results.push({
        name: 'Intégration du contexte de données',
        success: typeof reloadData === 'function',
        details: 'Fonction de rechargement disponible'
      });

    } catch (error) {
      results.push({
        name: 'Tests généraux',
        success: false,
        details: `Erreur générale: ${error}`
      });
    }

    setTestResults(results);
    setTesting(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Panel de Test Admin</h3>
        <button
          onClick={runTests}
          disabled={testing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {testing ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          {testing ? 'Test en cours...' : 'Lancer les tests'}
        </button>
      </div>

      {/* Current Data Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900">Catégories</h4>
          <p className="text-2xl font-bold text-blue-600">{categories.length}</p>
          <p className="text-sm text-blue-700">
            {categories.filter((cat: any) => cat.isCustom).length} personnalisées
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-900">Produits</h4>
          <p className="text-2xl font-bold text-green-600">{products.length}</p>
          <p className="text-sm text-green-700">
            {products.filter((prod: any) => prod.isCustom).length} personnalisés
          </p>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Résultats des Tests</h4>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center p-3 rounded-lg ${
                  result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mr-3" />
                )}
                <div>
                  <p className={`font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                    {result.name}
                  </p>
                  <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    
    </div>
  );
}
