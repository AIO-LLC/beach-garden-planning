"use client"

import { Spinner } from "@heroui/react"
import { useState, useEffect } from "react"
import { Form, Input, Button, addToast } from "@heroui/react"
import { Link } from "@heroui/link"
import PhoneInput from "@/components/phone-input"
import { title } from "@/components/primitives"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT
const API_URL = API_PORT ? `${API_HOST}:${API_PORT}` : API_HOST

export default function LogInPage() {
  const router = useRouter()
  const auth = useAuth()
  const [phone, setPhone] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [isInvalid, setIsInvalid] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Add to the top of your login page
  useEffect(() => {
    // Check if localStorage is available
    try {
      localStorage.setItem("test", "test")
      localStorage.removeItem("test")
      console.log("LocalStorage is available")
    } catch (e) {
      console.error("LocalStorage is NOT available:", e)
    }
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (!auth.isLoading && auth.isLoggedIn) {
      if (auth.isProfileComplete) {
        router.push("/planning")
      } else {
        router.push("/first-login")
      }
    }
  }, [auth.isLoading, auth.isLoggedIn, auth.isProfileComplete, router])

  const isFormValid = (): boolean => {
    return phone !== "" && password !== ""
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const phoneNumber = phone.replace(/\D/g, "")

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, password })
      })

      if (!response.ok) {
        setIsInvalid(true)
        setIsSubmitting(false)
        addToast({
          title: "Numéro de téléphone ou mot de passe incorrect.",
          color: "danger"
        })
        return
      }

      const data = await response.json()

      // Store auth data directly
      const authData = {
        token: data.token,
        userId: data.id,
        phone: data.phone,
        isProfileComplete: data.is_profile_complete,
        isAdmin: data.is_admin,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      }

      // Use a try-catch for localStorage to handle any mobile issues
      try {
        localStorage.setItem("beach_garden_auth", JSON.stringify(authData))
      } catch (storageError) {
        console.error("Failed to store auth data:", storageError)
        addToast({
          title: "Erreur de stockage. Veuillez réessayer.",
          color: "danger"
        })
        setIsSubmitting(false)
        return
      }

      // Wait a moment for storage to complete on mobile
      await new Promise(resolve => setTimeout(resolve, 200))

      // Use window.location for a complete page reload
      // This ensures the auth state is properly loaded
      if (data.is_profile_complete) {
        window.location.href = "/planning"
      } else {
        window.location.href = "/first-login"
      }
    } catch (error) {
      console.error("Login error:", error)
      setIsSubmitting(false)
      addToast({
        title: "Erreur de connexion. Veuillez réessayer.",
        color: "danger"
      })
    }
  }

  if (auth.isLoading) {
    return (
      <>
        <Spinner className="mt-8" size="lg" />
      </>
    )
  }

  return (
    <div>
      <h1 className="font-bold text-xl my-5">Se connecter</h1>
      <Form encType="multipart/form-data" method="post" onSubmit={onSubmit}>
        <span className="text-sm">Numéro de téléphone</span>
        <PhoneInput
          isInvalid={isInvalid}
          required
          name="phone"
          value={phone}
          onChange={newValue => {
            setIsInvalid(false)
            setPhone(newValue)
          }}
        />
        <Input
          isInvalid={isInvalid}
          required
          label="Mot de passe"
          labelPlacement="outside"
          name="password"
          placeholder="Entrez votre mot de passe"
          type="password"
          value={password}
          onValueChange={newValue => {
            setIsInvalid(false)
            setPassword(newValue)
          }}
        />
        <Link className="underline" href="/password-forgotten">
          Mot de passe oublié ?
        </Link>
        <Button
          color="primary"
          type="submit"
          isDisabled={!isFormValid() || isSubmitting}
          isLoading={isSubmitting}
        >
          Se connecter
        </Button>
      </Form>
    </div>
  )
}
