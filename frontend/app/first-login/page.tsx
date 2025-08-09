"use client"

import React from "react"
import { Form, Input, Button } from "@heroui/react"
import * as EmailValidator from "email-validator"
import { useRouter } from "next/navigation"
import { title } from "@/components/primitives"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!    
const API_PORT = process.env.NEXT_PUBLIC_API_PORT!

export default function FirstLoginPage() {
  const router = useRouter()

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
      return "Les deux mots de passe sont différents."
    }

    return null
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    var data = Object.fromEntries(new FormData(e.currentTarget))

    const getJwtClaimsResponse = await fetch(`${API_HOST}:${API_PORT}/jwt-claims`, {
      method: "GET",
      credentials: 'include',
    })

    if (!getJwtClaimsResponse.ok) {
      const { error } = await getJwtClaimsResponse.json()
      console.error(error)
      return
    }

    const { id, phone, _isProfileComplete } = await getJwtClaimsResponse.json()

    // Remove password confirmation from data
    const { password_confirmation, ...rest} = data

    const payload = {
      id: id,
      phone: phone,
      ...rest
    }

    console.log(payload)

    try {
      const url = `${API_HOST}:${API_PORT}/member`
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error(`Erreur ${response.status}`)
      else {
        location.replace("/planning")
      }
    } catch (err: any) {
      console.error(err)
    }
  }

  return (
    <div>
      <h1 className={title()}>Finalisez votre inscription</h1>
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
          isInvalid={
            getPasswordConfirmationError(passwordConfirmation) !== null
          }
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
    </div>
  )
}
