"use client"

import React from "react"
import {
  DatePicker,
  Form,
  Input,
  Select,
  SelectItem,
  Checkbox,
  Button
} from "@heroui/react"
import { getLocalTimeZone, today } from "@internationalized/date"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT!

export default function SignUpPage() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [profilePicture, setProfilePicture] = React.useState("")
  const [fftLicense, setFftLicense] = React.useState("")
  const [submitted, setSubmitted] = React.useState<any>(null)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const maxBirthDate = today(getLocalTimeZone()).subtract({ years: 5 })

  const getPhoneError = (value: string) => {
    const strippedValue = value.replace(/[\s()-]/g, "")

    if (strippedValue.length === 0) return null
    if (strippedValue[0] !== "+") {
      return "Veuillez renseigner l’indicateur pays (ex: “+590”)"
    }
    if ((strippedValue.slice(1).match(/[^0-9]/g) || []).length > 0) {
      return "Le numéro de téléphone est invalide."
    }

    return null
  }

  const getFftLicenseError = (value: string) => {
    if (value.length === 0) return null
    if (value.length !== 8) {
      return "Le numéro de licence FFT doit faire 8 caractères."
    }
    if ((value.slice(0, 7).match(/[^0-9]/) || []).length > 0) {
      return "Les 7 premiers caractères doivent être des chiffres."
    }
    if ((value[7].match(/[^A-Za-z]/) || []).length > 0) {
      return "Le dernier caractère doit être une lettre"
    }

    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null

    setSelectedFile(file)
    setProfilePicture(file ? file.name : "")
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    var data = Object.fromEntries(new FormData(e.currentTarget))

    var { terms, ...data } = data
    const payload = {
      id: "",
      ...data,
      profile_picture: profilePicture
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
        required
        label="Prénom"
        labelPlacement="outside"
        name="first_name"
        placeholder="Entrez votre prénom"
      />
      <Input
        required
        label="Nom"
        labelPlacement="outside"
        name="last_name"
        placeholder="Entrez votre nom de famille"
      />
      <Select
        required
        label="Sexe"
        labelPlacement="outside"
        name="gender"
        placeholder="Sélectionnez votre sexe"
      >
        <SelectItem key="M">Homme</SelectItem>
        <SelectItem key="F">Femme</SelectItem>
      </Select>
      <DatePicker
        required
        label="Date de naissance"
        labelPlacement="outside"
        maxValue={maxBirthDate}
        name="birth_date"
      />
      <Input
        required
        label="Adresse email"
        labelPlacement="outside"
        name="email"
        placeholder="Entrez votre adresse email"
        type="email"
      />
      <Input
        required
        label="Numéro de téléphone"
        labelPlacement="outside"
        name="phone"
        placeholder="Entrez votre numéro de téléphone"
        type="text"
      />
      <Input
        label="Numéro de licence FFT"
        labelPlacement="outside"
        name="fft_license"
        placeholder="Entrez votre numéro de licence"
        validationMessage={getFftLicenseError(fftLicense) || undefined}
        validationState={getFftLicenseError(fftLicense) ? "invalid" : undefined}
        value={fftLicense}
        onChange={e => setFftLicense(e.target.value)}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="profile-picture-upload">
          Photo de profil
        </label>
        <div className="relative group">
          <input
            accept="image/*"
            className="sr-only"
            id="profile-picture-upload"
            name="profile_picture"
            type="file"
            onChange={handleFileChange}
          />
          <label
            className="
              flex items-center w-full min-h-[40px]
              bg-default-50 border-2 border-default-200
              rounded-medium cursor-pointer
              hover:border-default-300 transition-colors
              focus-within:ring-2 focus-within:ring-primary-200 focus-within:border-primary
            "
            htmlFor="profile-picture-upload"
          >
            <span
              className="
                inline-flex items-center px-3 py-2
                bg-default-100 hover:bg-default-200
                border-r border-default-200
                rounded-l-medium text-sm font-normal text-foreground
                transition-colors
              "
            >
              Choisir un fichier
            </span>
            <span className="flex-1 px-3 py-2 text-sm text-foreground-500">
              {selectedFile ? selectedFile.name : "Aucun fichier choisi"}
            </span>
          </label>
        </div>
      </div>

      <Checkbox
        name="terms"
        onChange={() => setErrors(prev => ({ ...prev, terms: undefined }))}
      >
        J&apos;accepte les termes et conditions.
      </Checkbox>
      {errors.terms && <p className="text-sm text-negative">{errors.terms}</p>}

      <Button type="submit">Confirmer</Button>

      {submitted && (
        <pre className="mt-4">{JSON.stringify(submitted, null, 2)}</pre>
      )}
    </Form>
  )
}
