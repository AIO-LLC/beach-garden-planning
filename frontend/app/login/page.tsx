"use client"

import { Spinner } from "@heroui/react"
import { useState, useEffect } from "react"
import { Form, Input, Button, addToast } from "@heroui/react"
import { Link } from "@heroui/link"
import PhoneInput from "@/components/phone-input"
import { title } from "@/components/primitives"
import { useAuth, login } from "@/hooks/useAuth"

export default function LogInPage() {
  const auth = useAuth()
  const [phone, setPhone] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [isInvalid, setIsInvalid] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!auth.isLoading && auth.isLoggedIn) {
      if (auth.isProfileComplete) {
        location.replace("/planning")
      } else {
        location.replace("/first-login")
      }
    }
  }, [auth.isLoading, auth.isLoggedIn, auth.isProfileComplete])

  const isFormValid = (): boolean => {
    return phone !== "" && password !== ""
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const phoneNumber = phone.replace(/\D/g, "")

    const result = await login(phoneNumber, password)

    if (result.success) {
      // Successful login
      if (result.isProfileComplete) {
        location.replace("/planning")
      } else {
        location.replace("/first-login")
      }
    } else {
      // Failed login
      setIsInvalid(true)
      setIsSubmitting(false)
      addToast({
        title: "Numéro de téléphone ou mot de passe incorrect.",
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
