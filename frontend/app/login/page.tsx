"use client"

import React from "react"
import { Form, Input, Button } from "@heroui/react"
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { title } from "@/components/primitives"

export default function LogInPage() {
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    var payload = Object.fromEntries(new FormData(e.currentTarget))

    try {
      // const url = `${API_HOST}:${API_PORT}/login`
      // const response = await fetch(url, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload)
      // })
      //
      // if (!response.ok) throw new Error(`Erreur ${response.status}`)

      Cookies.set('loginAttempt', 'true', { expires: 0.01, sameSite: 'lax' })
      router.push('/confirm')
    } catch (err: any) {
      console.error(err)
    }
  }

  return (
    <div>
      <h1 className={title()}>Se connecter</h1>
      <Form encType="multipart/form-data" method="post" onSubmit={onSubmit}>
        <Input
          required
          label="Numéro de téléphone"
          labelPlacement="outside"
          name="phone"
          placeholder="Entrez votre numéro de téléphone"
          type="text"
        />
        <Input
          required
          label="Mot de passe"
          labelPlacement="outside"
          name="password"
          placeholder="Entrez votre mot de passe"
          type="password"
        />
        <Button color="primary" type="submit">
          Se connecter
        </Button>
      </Form>
    </div>
  )
}
