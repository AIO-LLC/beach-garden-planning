"use client"

import React from "react"
import { Form, Input, Button, addToast } from "@heroui/react"
import { Link } from "@heroui/link"

import { title } from "@/components/primitives"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT!

export default function LogInPage() {
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const payload = Object.fromEntries(new FormData(e.currentTarget))

    try {
      const url = `${API_HOST}:${API_PORT}/login`
      const loginResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      })

      if (!loginResponse.ok) {
        addToast({
          title: "Numéro de téléphone ou mot de passe incorrect.",
          color: "danger"
        })

        // TODO: Update response from backend when unknown phone number or wrong password, and show a toast with another error message for server errors or others
        return
      }

      const { is_profile_complete } = await loginResponse.json()

      if (is_profile_complete) {
        location.replace("/planning")
      } else {
        location.replace("/first-login")
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
        <Link href="/password-forgotten">
          Mot de passe oublié ? Cliquez ici.
        </Link>
        <Button color="primary" type="submit">
          Se connecter
        </Button>
      </Form>
    </div>
  )
}
