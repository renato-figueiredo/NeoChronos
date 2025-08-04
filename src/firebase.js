// Ponto de entrada central para todos os serviços do Firebase

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Importa a nossa configuração secreta. O Git vai ignorar este ficheiro.
import { firebaseConfig } from "./firebaseConfig";

// 1. Inicializa a aplicação Firebase com as nossas chaves
const app = initializeApp(firebaseConfig);

// 2. Obtém acesso aos serviços que vamos usar
const auth = getAuth(app);      // Serviço de Autenticação
const db = getFirestore(app); // Serviço da Base de Dados Firestore

// 3. Exporta os serviços para que o resto da nossa aplicação os possa usar
export { auth, db };
