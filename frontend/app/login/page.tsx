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
  const auth = useAuth({ redirectTo: "/planning" })
  const [phone, setPhone] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [isInvalid, setIsInvalid] = useState<boolean>(false)

  const isFormValid = (): boolean => {
    return phone !== "" && password !== ""
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

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
        addToast({
          title: "Numéro de téléphone ou mot de passe incorrect.",
          color: "danger"
        })

        // TODO: Update response from backend when unknown phone number or wrong password, and show a toast with another error message for server errors or others
        return
      }

      const { is_profile_complete, cookie } = await loginResponse.json()
      document.cookie = cookie

      if (is_profile_complete) {
        router.push("/planning")
      } else {
        router.push("/first-login")
      }
    } catch (err: any) {
      console.error(err)
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
        <Button color="primary" type="submit" isDisabled={!isFormValid()}>
          Se connecter
        </Button>
      </Form>
    </div>
  )
}
