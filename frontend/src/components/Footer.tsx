import React from 'react';
import { Phone, Mail, MapPin, Facebook, Linkedin, Twitter, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold mb-4 text-blue-400">Bedouielec Transformateurs</h3>
            <p className="text-gray-300 mb-4">
              Votre partenaire de confiance en équipements électriques industriels depuis plus de 20 ans. 
              Nous proposons des solutions techniques de haute qualité pour tous vos projets industriels.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">Rue Ommar el Mokhtar, Tabulba 5080</p>
                  <p className="text-gray-300">Monastir, Tunisie</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">+216 29493780</p>
                  
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <p className="text-gray-300">marwenyoussef2017@gmail.com</p>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">Lun-Ven: 8h00-17h30</p>
                  <p className="text-gray-300">Sam: 8h00-12h00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Nos produits</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Armoires électriques</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Câbles électriques</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Disjoncteurs</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Condensateurs</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Transformateurs</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Relais industriels</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contacteurs</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Variateurs de vitesse</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Conseil technique</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Devis gratuit</a></li>
            
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Installation</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Maintenance</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Formation</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Support après-vente</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              <p>&copy; 2025 Bedouielec Transformateurs. Tous droits réservés.</p>
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Conditions générales
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Politique de confidentialité
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Mentions légales
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}