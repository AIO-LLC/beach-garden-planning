"use client"

import React from "react"
import { Form, Input, Button } from "@heroui/react"
import * as EmailValidator from "email-validator"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT!

export default function FirstLoginPage() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [passwordConfirmation, setPasswordConfirmation] = React.useState("")

  const getEmailError = (value: string): string | null => {
    if (value.length === 0) return null

    if (!EmailValidator.validate(value)) {
      return "L'adresse email est invalide."
    }

    return null
  }

  const getPasswordError = (value: string): string | null => {
    if (value.length == 0) return null

    if (value.length < 8) {
      return "Le mot de passe doit contenir au moins 8 caractères."
    }
    if ((value.match(/[A-Z]/g) || []).length < 1) {
      return "Le mot de passe doit contenir au moins une majuscule."
    }
    if ((value.match(/[a-z]/g) || []).length < 1) {
      return "Le mot de passe doit contenir au moins une minuscule."
    }
    if ((value.match(/[0-9]/g) || []).length < 1) {
      return "Le mot de passe doit contenir au moins un chiffre"
    }
    if ((value.match(/[^A-Za-z0-9]/gi) || []).length < 1) {
      return "Le mot de passe doit contenir au moins un caractère spécial."
    }

    return null
  }

  const getPasswordConfirmationError = value => {
    if (value.length == 0) return null

    if (value != password) {
      return "Les deux mots de passes sont différents."
    }

    return null
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    var data = Object.fromEntries(new FormData(e.currentTarget))

    const payload = {
      id: "",
      ...data
    }

    try {
      const url = `${API_HOST}:${API_PORT}/member`
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error(`Erreur ${response.status}`)
      const result = await response.json()

      setSubmitted(result)
      setErrors({})
    } catch (err: any) {
      setErrors({ submit: err.message })
    }
  }

  return (
    <Form encType="multipart/form-data" method="post" onSubmit={onSubmit}>
      <Input
        isRequired
        label="Prénom"
        labelPlacement="outside"
        name="first_name"
        placeholder="Entrez votre prénom"
      />
      <Input
        isRequired
        label="Nom"
        labelPlacement="outside"
        name="last_name"
        placeholder="Entrez votre nom de famille"
      />
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
      <Input
        isRequired
        errorMessage={getPasswordError(password)}
        isInvalid={getPasswordError(password) !== null}
        label="Mot de passe"
        labelPlacement="outside"
        name="password"
        placeholder="Entrez votre mot de passe"
        type="password"
        value={password}
        onValueChange={setPassword}
      />
      <Input
        isRequired
        errorMessage={getPasswordConfirmationError(passwordConfirmation)}
        isInvalid={getPasswordConfirmationError(passwordConfirmation) !== null}
        label="Confirmation du mot de passe"
        labelPlacement="outside"
        name="password_confirmation"
        placeholder="Entrez de nouveau votre mot de passe"
        type="password"
        value={passwordConfirmation}
        onValueChange={setPasswordConfirmation}
      />

      <Button color="primary" type="submit">
        Confirmer
      </Button>
    </Form>
  )
}
