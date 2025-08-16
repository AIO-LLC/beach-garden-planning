"use client"

import React from "react"
import { Form, Input, Button } from "@heroui/react"
import * as EmailValidator from "email-validator"

import { title } from "@/components/primitives"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT!

export default function FirstLoginPage() {
  const [firstName, setFirstName] = React.useState<string>("")
  const [lastName, setLastName] = React.useState<string>("")
  const [email, setEmail] = React.useState<string>("")
  const [password, setPassword] = React.useState<string>("")
  const [passwordConfirmation, setPasswordConfirmation] =
    React.useState<string>("")

  const capitalizeWords = (value: string): string => {
    let result = ""
    let capitalizeNext = true
    const separators: [string] = [" ", "-", "'", "."]

    for (let i = 0; i < value.length; i++) {
      const char = value[i]

      if (separators.includes(char)) {
        result += char
        capitalizeNext = true
      } else {
        if (capitalizeNext) {
          result += char.toUpperCase()
          capitalizeNext = false
        } else {
          result += char.toLowerCase()
        }
      }
    }

    return result
  }

  const getFirstNameError = (value: string): string | null => {
    if (value.trim().length === 0) return "Le prénom est requis."
    return null
  }

  const getLastNameError = (value: string): string | null => {
    if (value.trim().length === 0) return "Le nom est requis."
    return null
  }

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

  const isFormValid = (): boolean => {
    const firstNameError = getFirstNameError(firstName)
    const lastNameError = getLastNameError(lastName)
    const emailError = getEmailError(email)
    const passwordError = getPasswordError(password)
    const passwordConfirmationError =
      getPasswordConfirmationError(passwordConfirmation)

    return (
      !firstNameError &&
      !lastNameError &&
      !emailError &&
      !passwordError &&
      !passwordConfirmationError
    )
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    var data = Object.fromEntries(new FormData(e.currentTarget))

    const getJwtClaimsResponse = await fetch(
      `${API_HOST}:${API_PORT}/jwt-claims`,
      {
        method: "GET",
        credentials: "include"
      }
    )

    if (!getJwtClaimsResponse.ok) {
      const { error } = await getJwtClaimsResponse.json()

      console.error(error)

      return
    }

    const { id, phone, _isProfileComplete } = await getJwtClaimsResponse.json()

    // Remove password confirmation from data
    const { password_confirmation, ...rest } = data

    const payload = {
      id: id,
      phone: phone,
      ...rest
    }

    console.log(payload)

    try {
      const url = `${API_HOST}:${API_PORT}/member-with-password`
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error(`Erreur ${response.status}`)
      else {
        const refreshJwtPayload = { member_id: id }
        const refreshResponse = await fetch(
          `${API_HOST}:${API_PORT}/refresh-jwt`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(refreshJwtPayload)
          }
        )

        if (refreshResponse.ok) {
          // Token refreshed successfully, redirect to planning
          window.location.href = "/planning"
        } else {
          // If refresh fails, log the user out & redirect to login
          console.warn(
            "Token refresh failed, but profile was updated. Redirecting to login."
          )
          // TODO: delete JWT from client
          window.location.href = "/login"
        }
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
          value={firstName}
          onValueChange={value => setFirstName(capitalizeWords(value))}
        />

        <Input
          isRequired
          label="Nom"
          labelPlacement="outside"
          name="last_name"
          placeholder="Entrez votre nom de famille"
          value={lastName}
          onValueChange={value => setLastName(capitalizeWords(value))}
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

        <Button color="primary" type="submit" isDisabled={!isFormValid()}>
          Confirmer
        </Button>
      </Form>
    </div>
  )
}
