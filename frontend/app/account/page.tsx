"use client"

import { Spinner } from "@heroui/react"
import { Link } from "@heroui/link"
import { button as buttonStyles } from "@heroui/theme"
import { useState, useEffect } from "react"
import { Form, Input, Button, addToast } from "@heroui/react"
import * as EmailValidator from "email-validator"

import PhoneInput from "@/components/phone-input"
import { title } from "@/components/primitives"
import { useAuth, authenticatedFetch } from "@/hooks/useAuth"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT
const API_URL = API_PORT ? `${API_HOST}:${API_PORT}` : API_HOST

type Member = {
  id: string
  phone: string
  password: string // TODO: avoid retrieving it
  email: string
  first_name: string
  last_name: string
}

const emptyMember: Member = {
  id: "",
  phone: "",
  password: "",
  email: "",
  first_name: "",
  last_name: ""
}

export default function AccountPage() {
  const auth = useAuth({ requireAuth: true, requireProfile: true })
  const [originalMember, setOriginalMember] = useState<Member>(emptyMember)
  const [member, setMember] = useState<Member>(emptyMember)

  const capitalizeWords = (value: string): string => {
    let result = ""
    let capitalizeNext = true
    const separators: string[] = [" ", "-", "'", "."]

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

  const getPhoneError = (value: string): string => {
    if (value.length === 0) return "Le numéro de téléphone est requis."
    if (value.length < 10 || value.length > 15)
      return "Le numéro de téléphone est invalide."
    return ""
  }

  const getFirstNameError = (value: string): string => {
    if (value.trim().length === 0) return "Le prénom est requis."
    return ""
  }

  const getLastNameError = (value: string): string => {
    if (value.trim().length === 0) return "Le nom est requis."
    return ""
  }

  const getEmailError = (value: string): string => {
    if (value.length === 0) return "L'adresse email est requise."

    if (!EmailValidator.validate(value)) {
      return "L'adresse email est invalide."
    }

    return ""
  }

  const isFormValid = (): boolean => {
    if (!member) return false

    const phoneError = getPhoneError(member.phone)
    const firstNameError = getFirstNameError(member.first_name)
    const lastNameError = getLastNameError(member.last_name)
    const emailError = getEmailError(member.email)

    return (
      phoneError === "" &&
      firstNameError === "" &&
      lastNameError === "" &&
      emailError === ""
    )
  }

  const hasValuesChanged = (): boolean => {
    if (!member || !originalMember) return false

    return (
      member.phone !== originalMember.phone ||
      member.first_name !== originalMember.first_name ||
      member.last_name !== originalMember.last_name ||
      member.email !== originalMember.email
    )
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const phoneError: string = getPhoneError(member.phone)
    const firstNameError: string = getFirstNameError(member.first_name)
    const lastNameError: string = getLastNameError(member.last_name)
    const emailError: string = getEmailError(member.email)

    // If any validation errors, don't submit
    if (!isFormValid) {
      addToast({
        title: "Veuillez corriger les erreurs dans le formulaire.",
        color: "danger"
      })
      return
    }

    var data = Object.fromEntries(new FormData(e.currentTarget))
    if (typeof data.phone === "string") {
      data.phone = data.phone.replace(/\D/g, "")
    }

    const payload = {
      id: auth.userId,
      ...data
    }

    try {
      const url = `${API_URL}/member`
      const response = await authenticatedFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        addToast({
          title: "Une erreur est survenue. Veuillez réessayer plus tard.",
          color: "danger"
        })
      } else {
        addToast({
          title: "Votre compte a été mis à jour.",
          color: "success"
        })
        setOriginalMember({ ...member })
      }
    } catch (err: any) {
      console.error(err)
      addToast({
        title: "Une erreur est survenue. Veuillez réessayer plus tard.",
        color: "danger"
      })
    }
  }

  useEffect(() => {
    const getMemberData = async (id: string): Promise<Member | null> => {
      const response = await authenticatedFetch(`${API_URL}/member/${id}`, {
        method: "GET"
      })

      if (!response.ok) {
        const { error } = await response.json()
        console.error(error)
        return null
      }

      return await response.json()
    }

    if (auth.userId && !auth.isLoading) {
      getMemberData(auth.userId).then(memberData => {
        if (memberData !== null) {
          memberData.phone = "+" + memberData.phone
          setMember(memberData)
          setOriginalMember(memberData)
        }
      })
    }
  }, [auth.userId, auth.isLoading])

  if (member == emptyMember || auth.isLoading) {
    return (
      <>
        <Spinner className="mt-8" size="lg" />
      </>
    )
  }

  return (
    <div>
      <h1 className="font-bold text-xl my-4">Mon compte</h1>
      <Form
        className="gap-4"
        encType="multipart/form-data"
        method="post"
        onSubmit={onSubmit}
      >
        <span className="text-sm">Numéro de téléphone</span>
        <PhoneInput
          errorMessage={getPhoneError(member.phone)}
          isInvalid={getPhoneError(member.phone) !== ""}
          name="phone"
          value={member.phone}
          onChange={newValue => {
            setMember(prev => ({
              ...prev!,
              phone: newValue
            }))
          }}
        />

        <Input
          errorMessage={getFirstNameError(member.first_name)}
          isInvalid={getFirstNameError(member.first_name) !== ""}
          label="Prénom"
          labelPlacement="outside"
          name="first_name"
          placeholder="Entrez votre prénom"
          value={member.first_name}
          onValueChange={newValue => {
            setMember(prev => ({
              ...prev!,
              first_name: capitalizeWords(newValue)
            }))
          }}
        />

        <Input
          errorMessage={getLastNameError(member.last_name)}
          isInvalid={getLastNameError(member.last_name) !== ""}
          label="Nom"
          labelPlacement="outside"
          name="last_name"
          placeholder="Entrez votre nom de famille"
          value={member.last_name}
          onValueChange={newValue => {
            setMember(prev => ({
              ...prev!,
              last_name: capitalizeWords(newValue)
            }))
          }}
        />
        <Input
          errorMessage={getEmailError(member.email)}
          isInvalid={getEmailError(member.email) !== ""}
          label="Adresse email"
          labelPlacement="outside"
          name="email"
          placeholder="Entrez votre adresse email"
          type="email"
          value={member.email}
          onValueChange={newValue => {
            setMember(prev => ({
              ...prev!,
              email: newValue
            }))
          }}
        />
        <Link
          className={
            buttonStyles({
              color: "default",
              radius: "md"
            }) + " w-full mt-4"
          }
          href="/edit-password"
        >
          Modifier mon mot de passe
        </Link>

        <div className="w-full flex justify-between mt-4">
          <Button onClick={() => location.replace("/planning")}>Retour</Button>
          <Button
            color="primary"
            type="submit"
            isDisabled={!isFormValid() || !hasValuesChanged()}
          >
            Mettre à jour
          </Button>
        </div>
      </Form>
    </div>
  )
}
