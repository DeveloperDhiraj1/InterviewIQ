import axios from 'axios'

const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: serverUrl,
  withCredentials: true,
})

export default api
