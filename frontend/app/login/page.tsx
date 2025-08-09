"use client"

import React from "react"
import { Form, Input, Button } from "@heroui/react"

import { title } from "@/components/primitives"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT!

export default function LogInPage() {
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    var payload = Object.fromEntries(new FormData(e.currentTarget))

    try {
      const url = `${API_HOST}:${API_PORT}/login`
      const loginResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      })

      if (!loginResponse.ok) {
        const { error } = await loginResponse.json()

        if (loginResponse.status === 404) console.error("Wrong credentials")
        else console.error(error)

        return
      }

      const { _message, is_profile_complete } = await loginResponse.json()

      if (is_profile_complete) {
        location.replace("/planning")
      } else {
        location.replace("/first-login")
      }
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
