"use client"

import React from "react"
import { useRouter } from 'next/navigation'
import { Form, Input, Button } from "@heroui/react"

export default function ConfirmPage() {
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    var payload = Object.fromEntries(new FormData(e.currentTarget))

    try {
      console.log(payload)

      // const url = `${API_HOST}:${API_PORT}/login`
      // const response = await fetch(url, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload)
      // })
      //
      // if (!response.ok) throw new Error(`Erreur ${response.status}`)

      router.push('/')
    } catch (err: any) {
      console.error(err)
    }
  }
  return (
    <Form onSubmit={onSubmit}>
      <Input name="otp" minLength={6} maxLength={6} placeholder="Entrez le code reçu par SMS" required/>
      <Button type="submit">Confirmer</Button>
    </Form>
  )
}
