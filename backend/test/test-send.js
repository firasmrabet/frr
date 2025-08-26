import axios from 'axios';

const testData = {
  name: "Test Client",
  email: "firassmrabett111@gmail.com", // utilisation de l'email de test
  phone: "+216 99 999 999",
  company: "Test Company",
  message: "Ceci est un test d'envoi de devis",
  products: [
    {
      product: {
        name: "Produit Test 1",
        price: 100
      },
      quantity: 2,
      totalPrice: 200
    },
    {
      product: {
        name: "Produit Test 2",
        price: 150
      },
      quantity: 1,
      totalPrice: 150
    }
  ]
};

async function testSendQuote() {
  try {
    console.log('Envoi de la requête de test...');
    const response = await axios.post('http://localhost:5000/send-quote', testData, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'Zyd9/Z2bg51ek+cX8OQQ+WrZQT+TRGKAdqeUdMqlqhE='
      }
    });
    console.log('Réponse reçue:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur détaillée lors du test:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Pas de réponse reçue');
      console.error('Request:', error.request);
    } else {
      console.error('Erreur:', error.message);
    }
    throw error;
  }
}

// Exécuter le test
testSendQuote()
  .then(() => console.log('Test terminé avec succès'))
  .catch(() => process.exit(1));
