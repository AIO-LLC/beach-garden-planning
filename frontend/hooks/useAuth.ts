"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT
const API_URL = API_PORT ? `${API_HOST}:${API_PORT}` : API_HOST

interface AuthState {
  isLoading: boolean
  isLoggedIn: boolean
  isProfileComplete: boolean
  isAdmin: boolean
}

interface UseAuthOptions {
  requireAuth?: boolean
  requireProfile?: boolean
  requireAdmin?: boolean
  redirectTo?: string
}

export function useAuth(options: UseAuthOptions = {}) {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isLoggedIn: false,
    isProfileComplete: false,
    isAdmin: false
  })

  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch(`${API_URL}/jwt-claims`, {
          method: "GET",
          credentials: "include"
        })

        if (response.ok) {
          const claims = await response.json()
          const newState = {
            isLoading: false,
            isLoggedIn: true,
            isProfileComplete: claims.is_profile_complete,
            isAdmin: claims.is_admin
          }
          setAuthState(newState)

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

          // Redirect completed profiles away from incomplete-only pages
          if (newState.isLoggedIn && newState.isProfileComplete) {
            const currentPath = window.location.pathname
            const shouldRedirectToPlanning = [
              "/login",
              "/first-login",
              "/password-forgotten",
              "/password-reset"
            ].includes(currentPath)

            if (shouldRedirectToPlanning) {
              router.replace("/planning")
              return
            }
          }

          // Redirect incomplete profiles to first-login
          if (newState.isLoggedIn && !newState.isProfileComplete) {
            const currentPath = window.location.pathname
            const shouldRedirectToFirstLogin = [
              "/account",
              "/edit-password",
              "/login",
              "/password-forgotten",
              "/password-reset",
              "/planning",
              "/admin-panel"
            ].includes(currentPath)

            if (shouldRedirectToFirstLogin) {
              router.replace("/first-login")
              return
            }
          }
        } else {
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

    checkAuth()
  }, [
    options.requireAuth,
    options.requireProfile,
    options.requireAdmin,
    options.redirectTo,
    router
  ])

  return authState
}

// Usage examples:
// const auth = useAuth({ requireAuth: true }) // For protected pages
// const auth = useAuth({ requireAuth: true, requireProfile: true }) // For profile-complete pages
// const auth = useAuth({ requireAuth: true, requireAdmin: true }) // For admin pages
