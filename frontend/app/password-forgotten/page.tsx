"use client"

import React from "react"
import { Form, Input, Button, addToast } from "@heroui/react"
import * as EmailValidator from "email-validator"

import { title } from "@/components/primitives"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT!

export default function PasswordForgottenPage() {
  const [email, setEmail] = React.useState("")

  const getEmailError = (value: string): string | null => {
    if (value.length === 0) return null

    if (!EmailValidator.validate(value)) {
      return "L'adresse email est invalide."
    }

    return null
  }

  const isFormValid = (): boolean => {
    const emailError = getEmailError(email)

    return !emailError && email !== ""
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const payload = { email }
      const url = `${API_HOST}:${API_PORT}/password-forgotten`
      const passwordForgottenResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      })

      if (!passwordForgottenResponse.ok) {
        addToast({
          title: "Une erreur est survenue. Veuillez réessayer plus tard.",
          color: "danger"
        })
        const { error } = await passwordForgottenResponse.json()

        console.error(error)

        return
      }

      location.replace("/login")
    } catch (err: any) {
      console.error(err)
      addToast({
        title: "Une erreur est survenue. Veuillez réessayer plus tard.",
        color: "danger"
      })
    }
  }

  return (
    <div>
      <h1 className="font-bold text-xl my-4">Mot de passe oublié</h1>
      <p className="mb-5">
        Veuillez entrer l'adresse email lié à votre compte afin de recevoir un
        lien pour réinitialiser votre mot de passe.
      </p>
      <Form encType="multipart/form-data" method="post" onSubmit={onSubmit}>
        <Input
          isRequired
          errorMessage={getEmailError(email)}
          isInvalid={getEmailError(email) !== null}
          label="Adresse email"
          labelPlacement="outside"
          name="email"
          placeholder="Entrez votre adresse email"
          type="email"
          value={email}
          onValueChange={setEmail}
        />
        <div className="w-full flex justify-between">
          <Button onClick={() => location.replace("/login")}>Retour</Button>
          <Button color="primary" type="submit" isDisabled={!isFormValid()}>
            Confirmer
          </Button>
        </div>
      </Form>
    </div>
  )
}
