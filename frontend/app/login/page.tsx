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

  // Redirect if already logged in
  useEffect(() => {
    if (!auth.isLoading && auth.isLoggedIn) {
      if (auth.isProfileComplete) {
        router.replace("/planning")
      } else {
        router.replace("/first-login")
      }
    }
  }, [auth.isLoading, auth.isLoggedIn, auth.isProfileComplete, router])

  const isFormValid = (): boolean => {
    return phone !== "" && password !== ""
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    var payload = Object.fromEntries(new FormData(e.currentTarget))
    if (typeof payload.phone === "string") {
      payload.phone = payload.phone.replace(/\D/g, "")
    }

    try {
      const url = `${API_URL}/login`
      const loginResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      })

      if (!loginResponse.ok) {
        setIsInvalid(true)
        setIsSubmitting(false)
        addToast({
          title: "Numéro de téléphone ou mot de passe incorrect.",
          color: "danger"
        })
        return
      }

      const { is_profile_complete } = await loginResponse.json()
      
      // Don't manually set cookie - the browser will handle it from Set-Cookie header
      // Just wait a moment for the cookie to be properly set
      await new Promise(resolve => setTimeout(resolve, 100))

      // Use window.location for a hard redirect to ensure cookies are properly loaded
      if (is_profile_complete) {
        window.location.href = "/planning"
      } else {
        window.location.href = "/first-login"
      }
    } catch (err: any) {
      console.error(err)
      setIsSubmitting(false)
      addToast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer plus tard.",
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
