import fetch from 'node-fetch';

const testData = {
  name: "Test Client",
  email: "firassmrabett111@gmail.com",
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

console.log('🚀 Démarrage du test...');
console.log('📦 Données à envoyer:', JSON.stringify(testData, null, 2));

fetch('http://localhost:5001/send-quote', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'Zyd9/Z2bg51ek+cX8OQQ+WrZQT+TRGKAdqeUdMqlqhE='
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('📡 Statut de la réponse:', response.status);
  console.log('📡 Headers:', Object.fromEntries(response.headers.entries()));
  return response.json();
})
.then(data => {
  console.log('✅ Réponse reçue:', data);
  if (data.success) {
    console.log('✨ Test réussi ! Le devis a été envoyé avec succès.');
  } else {
    console.error('❌ Erreur:', data.error);
    process.exit(1);
  }
})
.catch(error => {
  console.error('❌ Erreur lors du test:', error);
  process.exit(1);
});
