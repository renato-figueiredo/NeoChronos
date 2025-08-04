// src/stores/authStore.js
import { defineStore } from 'pinia'
import { auth } from '@/firebase'
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'

// Função para obter o token de autenticação através da API da extensão
function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(chrome.runtime.lastError)
      } else {
        resolve(token)
      }
    })
  })
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isLoggedIn: false,
  }),

  actions: {
    // Ação de login refatorizada para usar a API chrome.identity
    async loginWithGoogle() {
      try {
        console.log('A iniciar login via chrome.identity...')
        const authToken = await getAuthToken()
        const credential = GoogleAuthProvider.credential(null, authToken)

        console.log('Token obtido, a fazer login no Firebase...')
        const result = await signInWithCredential(auth, credential)

        this.user = {
          uid: result.user.uid,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
        }
        this.isLoggedIn = true
        console.log('Utilizador logado com sucesso:', this.user)
      } catch (error) {
        console.error('Erro durante o login com Google via identity:', error)
        this.user = null
        this.isLoggedIn = false
      }
    },

    async logout() {
      try {
        const token = await new Promise((resolve) => {
          chrome.identity.getAuthToken({ interactive: false }, (token) => resolve(token))
        })

        if (token) {
           await fetch('https://accounts.google.com/o/oauth2/revoke?token=' + token);
          await new Promise((resolve) => {
            chrome.identity.removeCachedAuthToken({ token }, resolve)
          })
        }

        await signOut(auth)
        console.log('Utilizador deslogado e token removido com sucesso.')

        this.user = null
        this.isLoggedIn = false
      } catch (error) {
        console.error('Erro durante o logout:', error)
      }
    },

    listenForAuthStateChanges() {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.user = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
          }
          this.isLoggedIn = true
        } else {
          this.user = null
          this.isLoggedIn = false
        }
      })
    },
  },
})
