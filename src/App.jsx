import React, { useState, useEffect } from 'react';
import {
  auth,
  db,
  storage,
  registerUser,
  loginUser,
  logoutUser,
  addProduct,
  getProducts,
  getUserProducts,
  onAuthStateChanged,
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  ref,
  uploadBytes,
  getDownloadURL,
  onSnapshot
} from './firebase';

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  // Cargar estado de usuario y productos
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          name: currentUser.displayName || 'Usuario'
        });

        const userProducts = await getUserProducts(currentUser.uid);
        setProducts(userProducts);
      } else {
        setUser(null);
        setProducts([]);
      }
    });

    // Cargar todos los productos desde Firestore
    const loadAllProducts = async () => {
      const allProducts = await getProducts();
      setProducts(allProducts);
    };

    loadAllProducts();

    // Modo oscuro
    const storedDarkMode = JSON.parse(localStorage.getItem('trato_dark_mode')) || false;
    setDarkMode(storedDarkMode);

    return () => unsubscribe();
  }, []);

  // Guardar modo oscuro
  useEffect(() => {
    localStorage.setItem('trato_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Escuchar productos en tiempo real
  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(updatedProducts);
    });

    return () => unsubscribe();
  }, []);

  // Mostrar notificaciones
  window.showNotification = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `
      fixed top-4 right-4 px-4 py-2 rounded shadow-lg z-50
      ${type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-indigo-500 text-white'}
      animate-fade-in-down
    `;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  return (
    <div className={`min-h-screen font-sans ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-indigo-600">TRATO</h1>
        <nav className="hidden md:flex space-x-4">
          <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-indigo-600' : ''}>
            Inicio
          </button>
          <button onClick={() => setActiveTab('market')} className={activeTab === 'market' ? 'text-indigo-600' : ''}>
            Mercado
          </button>
          <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'text-indigo-600' : ''}>
            Perfil
          </button>
          <button onClick={() => window.location.hash = '#publish'} className="text-indigo-600">Publicar</button>
          <button onClick={async () => {
            await logoutUser();
            window.location.reload();
          }} className="text-red-500 hover:text-red-700">
            Salir
          </button>
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'home' && <HomeSection products={products} />}
        {activeTab === 'market' && <MarketSection products={products} />}
        {activeTab === 'profile' && <ProfileSection user={user} />}
      </main>

      {/* Footer Navigation */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t shadow-md">
        <div className="flex justify-around py-3">
          <button onClick={() => setActiveTab('home')} className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 1 1 1h3m10 0h3m-3 0a1 1 0 1 0 1-1v-7a9 9 0 1 0 1-1h-2M9 21H7M16 11v2a2 2 0 0 0 2 2h2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
            <span className="text-xs">Inicio</span>
          </button>
          <button onClick={() => setActiveTab('market')} className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 1 0-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-xs">Mercado</span>
          </button>
          <button onClick={() => window.location.hash = '#myproducts'} className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.28a2 2 0 10 0 4H17a2 2 0 012 2z" />
            </svg>
            <span className="text-xs">Mis Productos</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 1 0-8 0 4 4 0 008 0zM12 14a7 7 0 1 1 0 14 7 7 0 010-14z" />
            </svg>
            <span className="text-xs">Perfil</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

// Home Section
const HomeSection = ({ products }) => {
  return (
    <section>
      <h2 className="text-3xl font-bold mb-6">Bienvenido a TRATO</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length > 0 ? (
          products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <p>No hay productos disponibles.</p>
        )}
      </div>
    </section>
  );
};

// Market Section
const MarketSection = ({ products }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <section>
      <h2 className="text-3xl font-bold mb-6">Mercado</h2>
      <input
        placeholder="Buscar productos..."
        value={filterQuery}
        onChange={e => setFilterQuery(e.target.value)}
        className="w-full border border-gray-300 dark:border-gray-600 p-2 mb-6 rounded"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length > 0 ? (
          filtered.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <p>No se encontraron productos.</p>
        )}
      </div>
    </section>
  );
};

// Profile Section
const ProfileSection = ({ user }) => {
  return (
    <section>
      <h2 className="text-3xl font-bold mb-6">Mi Perfil</h2>
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-md">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-indigo-200 dark:bg-indigo-800 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-200 font-bold text-xl">
            U
          </div>
          <div>
            <h3 className="text-xl">{user?.name}</h3>
            <p className="text-gray-600 dark:text-gray-300">{user?.email}</p>
          </div>
        </div>
        <button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">
          Editar Perfil
        </button>
      </div>
    </section>
  );
};

// Product Card
const ProductCard = ({ product }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden transform transition hover:scale-105">
      <img src={product.image} alt={product.name} className="w-full h-40 object-cover" />
      <div className="p-4">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">Vendedor: {product.seller || 'Anónimo'}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">Ubicación: {product.location}</p>
        <p className="mt-2 text-xl font-bold text-indigo-600">${product.price?.toLocaleString()}</p>
      </div>
    </div>
  );
};

// Publish Product
const PublishProduct = ({ onPublish, userId }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !location || !description || !image) {
      showNotification('Completa todos los campos e imagen', 'error');
      return;
    }

    setUploading(true);
    const imageRef = ref(storage, `products/${Date.now()}-${image.name}`);
    const snapshot = await uploadBytes(imageRef, image);
    const imageUrl = await getDownloadURL(snapshot.ref);

    const newProduct = {
      name,
      price: parseInt(price),
      location,
      description,
      seller: 'Usuario',
      rating: 4.7,
      image: imageUrl,
      userId,
      createdAt: new Date()
    };

    onPublish(newProduct, userId);
    setUploading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Publica un producto</h2>
        <input
          placeholder="Nombre del producto"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 mb-3 rounded"
          required
        />
        <input
          placeholder="Precio"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border p-2 mb-3 rounded"
          required
        />
        <input
          placeholder="Ubicación"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full border p-2 mb-3 rounded"
          required
        />
        <textarea
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 mb-3 rounded"
          rows="3"
          required
        />
        <input
          type="file"
          onChange={(e) => setImage(e.target.files[0])}
          className="w-full border p-2 mb-3 rounded"
          accept="image/*"
          required
        />
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded"
        >
          {uploading ? 'Subiendo...' : 'Publicar Producto'}
        </button>
      </form>
    </div>
  );
};

// My Products
const MyProductsSection = ({ products, onDelete }) => {
  return (
    <section className="container mx-auto px-4 py-6">
      <h2 className="text-3xl font-bold mb-6">Mis Productos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length > 0 ? (
          products.map(product => (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded shadow p-4 relative">
              <img src={product.image} alt={product.name} className="w-full h-40 object-cover mb-2" />
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Precio: ${product.price?.toLocaleString()}</p>
              <button
                onClick={() => onDelete(product.id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xl"
              >
                &times;
              </button>
            </div>
          ))
        ) : (
          <p>No has publicado ningún producto aún.</p>
        )}
      </div>
    </section>
  );
};

// Login Screen
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-800 dark:to-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 mb-3 rounded"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-2 mb-3 rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded mt-2"
          >
            Iniciar Sesión
          </button>
        </form>
        <p className="text-center mt-4">
          <a href="#register" className="text-indigo-600 hover:underline">¿No tienes cuenta? Regístrate</a>
        </p>
      </div>
    </div>
  );
};

// Register Screen
const RegisterScreen = ({ onRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleRegister = (e) => {
    e.preventDefault();
    onRegister(email, password, name);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-800 dark:to-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6">Regístrate</h2>
        <form onSubmit={handleRegister}>
          <input
            placeholder="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-2 mb-3 rounded"
            required
          />
          <input
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 mb-3 rounded"
            required
          />
          <input
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-2 mb-3 rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded mt-2"
          >
            Registrarse
          </button>
        </form>
        <p className="text-center mt-4">
          <a href="#login" className="text-indigo-600 hover:underline">¿Ya tienes cuenta? Inicia sesión</a>
        </p>
      </div>
    </div>
  );
};

export default App;