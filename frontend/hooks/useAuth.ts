"use client"
import { useState, useEffect, useCallback } from "react"
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
    if (!stored) {
      console.log("No auth data found in localStorage")
      return null
    }

    const auth = JSON.parse(stored) as StoredAuth
    console.log("Auth data retrieved:", { ...auth, token: auth.token ? "exists" : "missing" })

    // Check if token is expired
    if (Date.now() > auth.expiresAt) {
      console.log("Token expired, clearing auth")
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
    const authString = JSON.stringify(auth)
    localStorage.setItem(AUTH_KEY, authString)
    
    // Force a storage event for mobile browsers
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"))
    }
    
    console.log("Auth data stored successfully")
  } catch (error) {
    console.error("Error storing auth:", error)
  }
}

const clearStoredAuth = (): void => {
  localStorage.removeItem(AUTH_KEY)
  // Force a storage event for mobile browsers
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
  }
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
  // Use window.location.href for hard redirect
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

  const verifyAuth = useCallback(async () => {
    console.log("Verifying auth...")
    
    try {
      const storedAuth = getStoredAuth()

      if (!storedAuth) {
        console.log("No stored auth found")
        setAuthState({
          isLoading: false,
          isLoggedIn: false,
          isProfileComplete: false,
          isAdmin: false
        })

        if (options.requireAuth) {
          router.replace(options.redirectTo || "/login")
        }
        return
      }

      console.log("Verifying token with backend...")
      
      // Verify token with backend
      const response = await fetch(`${API_URL}/verify-token`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedAuth.token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Token verified successfully")

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
        if (options.requireAuth && !newState.isLoggedIn) {
          router.replace(options.redirectTo || "/login")
          return
        }

        if (
          options.requireProfile &&
          (!newState.isLoggedIn || !newState.isProfileComplete)
        ) {
          router.replace("/first-login")
          return
        }

        if (
          options.requireAdmin &&
          (!newState.isLoggedIn || !newState.isAdmin)
        ) {
          router.replace("/")
          return
        }
      } else {
        console.log("Token verification failed:", response.status)
        // Token is invalid
        clearStoredAuth()
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
    } catch (error) {
      console.error("Auth check failed:", error)
      clearStoredAuth()
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
  }, [
    options.requireAuth,
    options.requireProfile,
    options.requireAdmin,
    options.redirectTo,
    router
  ])

  useEffect(() => {
    // Add a small delay for mobile browsers to ensure localStorage is ready
    const timer = setTimeout(() => {
      verifyAuth()
    }, 50)
    
    return () => clearTimeout(timer)
  }, [verifyAuth])

  // Listen for storage events (for cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = () => {
      console.log("Storage event detected, re-verifying auth")
      verifyAuth()
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [verifyAuth])

  // Refresh token periodically (every 20 minutes)
  useEffect(() => {
    if (!authState.isLoggedIn) return

    const refreshInterval = setInterval(
      () => {
        verifyAuth()
      },
      20 * 60 * 1000
    )

    return () => clearInterval(refreshInterval)
  }, [authState.isLoggedIn, verifyAuth])

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
    console.log("Sending login request...")
    
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password })
    })

    if (!response.ok) {
      console.log("Login response not OK:", response.status)
      return { success: false, error: "Invalid credentials" }
    }

    const data = await response.json()
    console.log("Login response received, storing auth data...")

    // Store auth data with proper sync
    const authData: StoredAuth = {
      token: data.token,
      userId: data.id,
      phone: data.phone,
      isProfileComplete: data.is_profile_complete,
      isAdmin: data.is_admin,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    }
    
    setStoredAuth(authData)
    
    // Double-check the data was stored (for mobile debugging)
    const stored = getStoredAuth()
    if (!stored) {
      console.error("Failed to store auth data")
      return { success: false, error: "Storage failed" }
    }

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
