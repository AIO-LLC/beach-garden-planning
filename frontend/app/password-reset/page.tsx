"use client"

import React from "react"
import { Form, Input, Button, addToast } from "@heroui/react"
import { useSearchParams } from "next/navigation"

import { title } from "@/components/primitives"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT!

export default function PasswordResetPage() {
  const searchParams = useSearchParams()
  const token: string = searchParams.get("token")
  const email: string = searchParams.get("email")

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
      !newPasswordError &&
      !newPasswordConfirmationError &&
      newPassword !== "" &&
      newPasswordConfirmation !== ""
    )
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const payload = { token, email, new_password: newPassword }
      const url = `${API_HOST}:${API_PORT}/password-reset`
      const editPasswordResponse = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      })

      switch (editPasswordResponse.status) {
        case 200:
          location.replace("/login")
          break

        case 410:
          addToast({
            title:
              'Le lien de réinitialisation du mot de passe est invalide ou a expiré. Veuillez retourner sur la page "Mot de passe oublié".',
            color: "danger",
            timeout: "9999"
          })
          break

        case 422:
          console.error(await editPasswordResponse.json())
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
      <h1 className="font-bold text-xl my-4">Réinitialiser mon mot de passe</h1>
      <Form encType="multipart/form-data" method="post" onSubmit={onSubmit}>
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

        <Button
          className="mt-4"
          color="primary"
          type="submit"
          isDisabled={!isFormValid()}
        >
          Réinitialiser
        </Button>
      </Form>
    </div>
  )
}
