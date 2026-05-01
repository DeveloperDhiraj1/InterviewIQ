import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: 'interview-ai-b5abf.firebaseapp.com',
  projectId: 'interview-ai-b5abf',
  storageBucket: 'interview-ai-b5abf.firebasestorage.app',
  messagingSenderId: '352403213994',
  appId: '1:352403213994:web:f9cffc3d6d332a60fe8ad3',
  measurementId: 'G-LC9K7QLS71',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const provider = new GoogleAuthProvider()

let analytics = null

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app)
    }
  })
}

export { app, auth, analytics, provider }
