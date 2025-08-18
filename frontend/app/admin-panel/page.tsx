"use client"
import { useState } from "react"
import { button as buttonStyles } from "@heroui/theme"
import { Form, Input, Button, addToast, useDisclosure } from "@heroui/react"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@heroui/modal"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT!

export default function AdminPanelPage() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [formState, setFormState] = useState({
    phone: "",
    phoneError: "",
    isPhoneInvalid: false
  })
  const [isFormValid, setIsFormValid] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showSuccessScreen, setShowSuccessScreen] = useState<boolean>(false)
  const [memberData, setMemberData] = useState<{
    phone: string
    otp: string
  } | null>(null)
  const [hasCopied, setHasCopied] = useState<boolean>(false)

  const getPhoneError = (value: string): string => {
    if (value.length === 0) return "Veuillez entrer un numéro de téléphone."
    return ""
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setHasCopied(true)
      addToast({ title: "Mot de passe provisoire copié !", color: "success" })
    } catch (err) {
      console.error("Failed to copy OTP: ", err)
      addToast({
        title:
          "Erreur lors de la copie du mot de passe provisoire. Veuillez le copier manuellement.",
        color: "danger"
      })
    }
  }

  const resetModal = () => {
    setShowSuccessScreen(false)
    setMemberData(null)
    setHasCopied(false)
    setIsFormValid(false)
    setFormState({ phone: "", phoneError: "", isPhoneInvalid: false })
  }

  const onSubmit = async () => {
    const phoneError = getPhoneError(formState.phone)
    const isPhoneInvalid = phoneError !== ""

    setFormState(prev => ({
      ...prev,
      phoneError,
      isPhoneInvalid
    }))

    if (isPhoneInvalid) {
      setIsFormValid(false)
      return
    }

    setIsLoading(true)
    const addMemberPayload = {
      id: "",
      phone: formState.phone,
      password: "",
      email: "",
      first_name: "",
      last_name: ""
    }

    try {
      const res = await fetch(`${API_HOST}:${API_PORT}/member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(addMemberPayload)
      })

      if (res.status === 409) {
        setIsFormValid(false)
        setFormState(prev => ({
          ...prev,
          phoneError:
            "Ce numéro de téléphone est déjà associé à un compte existant.",
          isPhoneInvalid: true
        }))
        return
      }

      if (!res.ok) {
        setIsFormValid(false)
        const error = await res.json()
        console.error(error)
        addToast({
          title: "Une erreur est survenue. Veuillez réessayer plus tard.",
          color: "danger"
        })
        return
      }

      const resBody = await res.json()

      // Set member data and show success screen
      setMemberData({
        phone: formState.phone,
        otp: resBody.otp
      })
      setShowSuccessScreen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleModalClose = () => {
    resetModal()
    onOpenChange()
  }

  return (
    <>
      <h1 className="font-bold text-xl my-4">Administration</h1>
      <Button color="primary" onClick={onOpen}>
        Ajouter un membre
      </Button>
      <Modal
        closeButton={<div></div>}
        isDismissable={false}
        isKeyboardDismissDisabled
        isOpen={isOpen}
        onOpenChange={handleModalClose}
        placement="center"
        size="xs"
      >
        <ModalContent>
          {onClose => (
            <>
              {!showSuccessScreen ? (
                // Original form
                <>
                  <ModalHeader className="flex flex-col gap-1">
                    Ajouter un membre
                  </ModalHeader>
                  <Form
                    encType="multipart/form-data"
                    method="post"
                    onSubmit={e => {
                      e.preventDefault()
                      onSubmit()
                    }}
                  >
                    <ModalBody className="w-full">
                      <Input
                        className="w-full"
                        isDisabled={isLoading}
                        errorMessage={formState.phoneError}
                        isInvalid={formState.isPhoneInvalid}
                        label="Numéro de téléphone"
                        labelPlacement="outside"
                        name="phone"
                        placeholder="Entrez le numéro de téléphone"
                        type="text"
                        startContent="+"
                        value={formState.phone}
                        onValueChange={newValue => {
                          setIsFormValid(true)
                          setFormState({
                            phone: newValue,
                            phoneError: "",
                            isPhoneInvalid: false
                          })
                        }}
                      />
                    </ModalBody>
                    <ModalFooter className="w-full">
                      <Button
                        type="button"
                        onPress={() => {
                          resetModal()
                          onClose()
                        }}
                        isDisabled={isLoading}
                      >
                        Retour
                      </Button>
                      <Button
                        color="primary"
                        type="submit"
                        isDisabled={!isFormValid}
                        isLoading={isLoading}
                      >
                        Ajouter
                      </Button>
                    </ModalFooter>
                  </Form>
                </>
              ) : (
                // Success screen
                <>
                  <ModalHeader className="flex flex-col gap-1">
                    <span className="text-green-600 font-bold">
                      Membre ajouté !
                    </span>
                  </ModalHeader>
                  <ModalBody className="w-full">
                    <p>
                      Veuillez copier puis envoyer ce mot de passe provisoire au{" "}
                      <b>+{memberData?.phone}</b> :
                    </p>
                    <p className="text-lg font-bold text-center my-4">
                      {memberData?.otp}
                    </p>
                    <div className="flex w-full justify-between mb-2">
                      <Button
                        color="primary"
                        onPress={() => copyToClipboard(memberData?.otp || "")}
                      >
                        Copier
                      </Button>
                      {hasCopied && (
                        <Button
                          color="default"
                          onPress={() => {
                            resetModal()
                            onClose()
                          }}
                        >
                          Fermer
                        </Button>
                      )}
                    </div>
                  </ModalBody>
                </>
              )}
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
