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

  const getPhoneError = (value: string): string => {
    if (value.length === 0) return "Veuillez entrer un numéro de téléphone."
    return ""
  }

  const onSubmit = async onCloseFn => {
    const phoneError = getPhoneError(formState.phone)
    const isPhoneInvalid = phoneError !== ""

    setFormState(prev => ({
      ...prev,
      phoneError,
      isPhoneInvalid
    }))

    if (isPhoneInvalid) return

    const addMemberPayload = {
      id: "",
      phone: formState.phone,
      password: "",
      email: "",
      first_name: "",
      last_name: ""
    }

    const addMemberResponse = await fetch(`${API_HOST}:${API_PORT}/member`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(addMemberPayload)
    })

    if (!addMemberResponse.ok) {
      switch (addMemberResponse.status) {
        case 409:
          setFormState(prev => ({
            ...prev,
            phoneError:
              "Ce numéro de télphone est déjà associé à un compte existant.",
            isPhoneInvalid: true
          }))
          break

        default:
          const error = await addMemberResponse.json()
          console.error(error)
          break
      }
      return
    }

    onCloseFn()
    setFormState(prev => ({
      phone: "",
      phoneError: "",
      isPhoneInvalid: false
    }))
  }

  return (
    <>
      <h1 className="font-bold text-xl my-4">Administration</h1>
      <Button color="primary" onClick={onOpen}>
        Ajouter un membre
      </Button>
      <Modal
        isDismissable={false}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        size="xs"
      >
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Ajouter un membre
              </ModalHeader>
              <Form
                encType="multipart/form-data"
                method="post"
                onSubmit={event => {
                  event.preventDefault()
                  onSubmit(onClose)
                }}
              >
                <ModalBody className="w-full">
                  <Input
                    className="w-full"
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
                      setFormState(prev => ({
                        phone: newValue,
                        phoneError: "",
                        isPhoneInvalid: false
                      }))
                    }}
                  />
                </ModalBody>
                <ModalFooter className="w-full">
                  <Button onPress={onClose}>Retour</Button>
                  <Button color="primary" type="submit">
                    Ajouter
                  </Button>
                </ModalFooter>
              </Form>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
