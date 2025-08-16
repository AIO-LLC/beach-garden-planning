"use client"

import React from "react"
import { Form, Input, Button, addToast } from "@heroui/react"

import { title } from "@/components/primitives"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT!

export default function EditPasswordPage() {
  const [password, setPassword] = React.useState<string>("")
  const [newPassword, setNewPassword] = React.useState<string>("")
  const [newPasswordConfirmation, setNewPasswordConfirmation] =
    React.useState<string>("")

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

    if (value != newPassword) {
      return "Les deux mots de passe sont différents."
    }

    return null
  }

  const isFormValid = (): boolean => {
    const newPasswordError = getPasswordError(newPassword)
    const newPasswordConfirmationError = getPasswordConfirmationError(
      newPasswordConfirmation
    )

    return (
      password !== "" &&
      newPassword !== "" &&
      newPasswordConfirmation !== "" &&
      !newPasswordError &&
      !newPasswordConfirmationError
    )
  }
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
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
      const { id, _phone, _isProfileComplete } =
        await getJwtClaimsResponse.json()

      const payload = {
        id: id,
        current_password: password,
        new_password: newPassword
      }

      const url = `${API_HOST}:${API_PORT}/password`
      const editPasswordResponse = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      })

      switch (editPasswordResponse.status) {
        case 200:
          location.replace("/account")
          break

        case 401:
          addToast({
            title: "Le mot de passe actuel est incorrect.",
            color: "danger"
          })
          break

        case 422:
          addToast({
            title: "Le nouveau mot de passe doit être différent de l'actuel.",
            color: "danger"
          })
          break
      }
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
      <h1 className="font-bold text-xl my-4">Modifier mon mot de passe</h1>
      <Form encType="multipart/form-data" method="post" onSubmit={onSubmit}>
        <Input
          isRequired
          label="Mot de passe actuel"
          labelPlacement="outside"
          name="password"
          placeholder="Entrez votre mot de passe actuel"
          type="password"
          value={password}
          onValueChange={setPassword}
        />
        <Input
          isRequired
          errorMessage={getPasswordError(newPassword)}
          isInvalid={getPasswordError(newPassword) !== null}
          label="Nouveau de passe"
          labelPlacement="outside"
          name="new_password"
          placeholder="Entrez votre nouveau mot de passe"
          type="password"
          value={newPassword}
          onValueChange={setNewPassword}
        />
        <Input
          isRequired
          errorMessage={getPasswordConfirmationError(newPasswordConfirmation)}
          isInvalid={
            getPasswordConfirmationError(newPasswordConfirmation) !== null
          }
          label="Confirmation du nouveau mot de passe"
          labelPlacement="outside"
          name="new_password_confirmation"
          placeholder="Entrez votre nouveau mot de passe"
          type="password"
          value={newPasswordConfirmation}
          onValueChange={setNewPasswordConfirmation}
        />

        <Button color="primary" type="submit" isDisabled={!isFormValid()}>
          Mettre à jour
        </Button>
      </Form>
    </div>
  )
}
