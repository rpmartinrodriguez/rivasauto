// ==========================================
// js/firebase-config.js
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = { 
  apiKey: "AIzaSyDCQSEAMGBfd8MgMMEgaYZ5jAjhaPYfeng", 
  authDomain: "rivasauto.firebaseapp.com", 
  projectId: "rivasauto", 
  storageBucket: "rivasauto.firebasestorage.app", 
  messagingSenderId: "281188948058", 
  appId: "1:281188948058:web:fa17ccc44d58159da2e063" 
};

const app = initializeApp(firebaseConfig); 
const db = getFirestore(app); 
window.db = db;

window.fbAdd = async (collName, data) => { 
  try { 
    return await addDoc(collection(db, collName), data); 
  } catch (e) { 
    console.error("Error agregando documento: ", e); 
  } 
};

window.fbUpdate = async (collName, idStr, data) => { 
  try { 
    await updateDoc(doc(db, collName, idStr), data); 
  } catch (e) { 
    console.error("Error actualizando documento: ", e); 
  } 
};

window.fbDelete = async (collName, idStr) => { 
  try { 
    await deleteDoc(doc(db, collName, idStr)); 
  } catch (e) { 
    console.error("Error eliminando documento: ", e); 
  } 
};

// Exportamos lo necesario para que app.js pueda inicializar la sincronización
export { db, collection, addDoc, onSnapshot, getDocs };
