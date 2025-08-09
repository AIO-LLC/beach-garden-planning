"use client"

import { Link } from "@heroui/link"
import { button as buttonStyles } from "@heroui/theme"
import { useState, useEffect } from "react";
import { Form, Input, Button } from "@heroui/react"
import * as EmailValidator from "email-validator"
import { useRouter } from "next/navigation"
import { title } from "@/components/primitives"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!    
const API_PORT = process.env.NEXT_PUBLIC_API_PORT!

type Member = {
  id: string
  phone: string
  password: string // TODO: avoid retrieving it
  email: string
  first_name: string
  last_name: string
}

export default function ProfilePage() {
  const router = useRouter()

  const [member, setMember] = useState<Member | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")

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

    // Remove password confirmation from data
    const { password_confirmation, ...rest} = data

    const payload = {
      id: id,
      phone: phone,
      ...rest
    }

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
        window.reload()
      }
    } catch (err: any) {
      console.error(err)
    }
  }

  useEffect(() => {
    const getJwt = async () => {
      const getJwtClaimsResponse = await fetch(`${API_HOST}:${API_PORT}/jwt-claims`, {
        method: "GET",
        credentials: 'include',
      })

      if (!getJwtClaimsResponse.ok) {
        const { error } = await getJwtClaimsResponse.json()
        console.error(error)
        return
      }

      return await getJwtClaimsResponse.json()
    }

    const getMemberData = async (id): Member | null => {
      const response = await fetch(`${API_HOST}:${API_PORT}/member/${id}`, {
        method: "GET",
        credentials: 'include',
      })

      if (!response.ok) {
        const { error } = await response.json()
        console.error(error)
        return null
      }

      return await response.json()
    }

    getJwt().then(claims => {
        const {id, _phone, _is_profile_complete } = claims
        getMemberData(id).then(memberData => {
          console.log(memberData)
          setMember(memberData)
        })
    })
  }, [])

  if (!member) {
    return <span>Chargement du profil...</span>
  }

  return (
    <div>
      <h1 className={title()}>Profil</h1>
      <Form className="gap-4" encType="multipart/form-data" method="post" onSubmit={onSubmit}>
        <Input
          label="Prénom"
          labelPlacement="outside"
          name="first_name"
          placeholder="Entrez votre prénom"
          value={member.first_name}
        />
        <Input
          label="Nom"
          labelPlacement="outside"
          name="last_name"
          placeholder="Entrez votre nom de famille"
          value={member.last_name}
        />
        <Input
          errorMessage={getEmailError(email)}
          isInvalid={getEmailError(email) !== null}
          label="Adresse email"
          labelPlacement="outside"
          name="email"
          placeholder="Entrez votre adresse email"
          type="email"
          value={member.email}
          onValueChange={setEmail}
        />
        <Link
          className={buttonStyles({
            color: "default",
            radius: "md",
          }) + " w-full my-4"}
          href="/password"
        >
          Changer le mot de passe
        </Link>
        <Button color="primary" type="submit">
          Mettre à jour
        </Button>
      </Form>
    </div>
  )
}
