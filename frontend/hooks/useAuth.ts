"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT
const API_URL = API_PORT ? `${API_HOST}:${API_PORT}` : API_HOST

interface AuthState {
  isLoading: boolean
  isLoggedIn: boolean
  isProfileComplete: boolean
  isAdmin: boolean
  userId?: string
  phone?: string
}

interface UseAuthOptions {
  requireAuth?: boolean
  requireProfile?: boolean
  requireAdmin?: boolean
  redirectTo?: string
}

interface StoredAuth {
  token: string
  userId: string
  phone: string
  isProfileComplete: boolean
  isAdmin: boolean
  expiresAt: number
}

// Helper functions for token management
const AUTH_KEY = "beach_garden_auth"

const getStoredAuth = (): StoredAuth | null => {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(AUTH_KEY)
    if (!stored) return null

    const auth = JSON.parse(stored) as StoredAuth

    // Check if token is expired
    if (Date.now() > auth.expiresAt) {
      localStorage.removeItem(AUTH_KEY)
      return null
    }

    return auth
  } catch (error) {
    console.error("Error reading auth from storage:", error)
    localStorage.removeItem(AUTH_KEY)
    return null
  }
}

const setStoredAuth = (auth: StoredAuth): void => {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
  } catch (error) {
    console.error("Error storing auth:", error)
  }
}

const clearStoredAuth = (): void => {
  localStorage.removeItem(AUTH_KEY)
}

// Export for use in other components
export const getAuthToken = (): string | null => {
  const auth = getStoredAuth()
  return auth?.token || null
}

// Export logout function for use in other components
export const logout = async (): Promise<void> => {
  const token = getAuthToken()

  if (token) {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    } catch (error) {
      console.error("Logout API call failed:", error)
    }
  }

  clearStoredAuth()
  window.location.href = "/login"
}

export function useAuth(options: UseAuthOptions = {}) {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isLoggedIn: false,
    isProfileComplete: false,
    isAdmin: false
  })

  const router = useRouter()
  const hasVerified = useRef(false)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    // Prevent multiple verifications
    if (hasVerified.current) return

    const verifyAuth = async () => {
      try {
        const storedAuth = getStoredAuth()

        if (!storedAuth) {
          if (isMounted.current) {
            setAuthState({
              isLoading: false,
              isLoggedIn: false,
              isProfileComplete: false,
              isAdmin: false
            })
          }

          if (options.requireAuth && isMounted.current) {
            router.replace(options.redirectTo || "/login")
          }
          return
        }

        // Verify token with backend
        const response = await fetch(`${API_URL}/verify-token`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${storedAuth.token}`
          }
        })

        if (!isMounted.current) return

        if (response.ok) {
          const data = await response.json()

          const newState = {
            isLoading: false,
            isLoggedIn: true,
            isProfileComplete: data.is_profile_complete,
            isAdmin: data.is_admin,
            userId: data.id,
            phone: data.phone
          }

          setAuthState(newState)

          // Update stored auth with fresh data
          setStoredAuth({
            ...storedAuth,
            isProfileComplete: data.is_profile_complete,
            isAdmin: data.is_admin
          })

          // Handle redirects based on auth state
          if (options.requireProfile && !newState.isProfileComplete) {
            router.replace("/first-login")
            return
          }

          if (options.requireAdmin && !newState.isAdmin) {
            router.replace("/")
            return
          }
        } else {
          // Token is invalid
          clearStoredAuth()

          if (isMounted.current) {
            setAuthState({
              isLoading: false,
              isLoggedIn: false,
              isProfileComplete: false,
              isAdmin: false
            })

            if (options.requireAuth) {
              router.replace(options.redirectTo || "/login")
            }
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error)

        if (isMounted.current) {
          // Don't clear auth on network errors - just set loading to false
          setAuthState(prev => ({
            ...prev,
            isLoading: false
          }))
        }
      }
    }

    // Mark as verified before starting
    hasVerified.current = true

    // Add small delay for mobile browsers
    const timer = setTimeout(() => {
      verifyAuth()
    }, 100)

    return () => clearTimeout(timer)
  }, []) // Empty dependency array - run once on mount

  return authState
}

// Login function to be used in login page
export const login = async (
  phone: string,
  password: string
): Promise<{
  success: boolean
  isProfileComplete?: boolean
  error?: string
}> => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password })
    })

    if (!response.ok) {
      return { success: false, error: "Invalid credentials" }
    }

    const data = await response.json()

    // Store auth data
    setStoredAuth({
      token: data.token,
      userId: data.id,
      phone: data.phone,
      isProfileComplete: data.is_profile_complete,
      isAdmin: data.is_admin,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    })

    return {
      success: true,
      isProfileComplete: data.is_profile_complete
    }
  } catch (error) {
    console.error("Login failed:", error)
    return { success: false, error: "Login failed" }
  }
}

// Helper to make authenticated API calls
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken()

  if (!token) {
    throw new Error("No authentication token")
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  })
}
