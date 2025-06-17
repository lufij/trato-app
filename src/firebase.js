// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCMdzXfgYFkCW6PeDaKMKUwhJEI1ikn1Ag",
  authDomain: "trato-app-2668d.firebaseapp.com",
  projectId: "trato-app-2668d",
  storageBucket: "trato-app-2668d.firebasestorage.app",
  messagingSenderId: "545068027091",
  appId: "1:545068027091:web:64e930919f633871285826"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Funciones de autenticación
const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error) {
    return { error: error.message };
  }
};

const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error) {
    return { error: error.message };
  }
};

const logoutUser = async () => {
  try {
    await signOut(auth);
    return {};
  } catch (error) {
    return { error: error.message };
  }
};

// Funciones de productos
const addProduct = async (product) => {
  try {
    const docRef = await addDoc(collection(db, "products"), product);
    return { id: docRef.id, ...product };
  } catch (error) {
    return { error: error.message };
  }
};

const getProducts = async () => {
  try {
    const productsCollection = collection(db, "products");
    const productsSnapshot = await getDocs(productsCollection);
    const productList = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return productList;
  } catch (error) {
    console.error("Error obteniendo productos:", error);
    return [];
  }
};

const getUserProducts = async (userId) => {
  try {
    const productsCollection = collection(db, "products");
    const q = query(productsCollection, where("userId", "==", userId));
    const productsSnapshot = await getDocs(q);
    const productList = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return productList;
  } catch (error) {
    console.error("Error obteniendo productos del usuario:", error);
    return [];
  }
};

export {
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
  setDoc,
  updateDoc,
  deleteDoc,
  ref,
  uploadBytes,
  getDownloadURL,
  onSnapshot // ✅ Exportamos onSnapshot
};