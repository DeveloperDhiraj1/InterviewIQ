import { Navigate, useLocation } from 'react-router-dom'

function RequireAuth({ children }) {
  const location = useLocation()
  const token = localStorage.getItem('interviewiq-token')

  if (!token) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return children
}

export default RequireAuth
