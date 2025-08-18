"use client"
import { LuEye, LuTrash2 } from "react-icons/lu"
import { useState, useEffect } from "react"
import {
  Button,
  addToast,
  useDisclosure,
  Pagination,
  Tooltip,
  Form,
  Input
} from "@heroui/react"
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell
} from "@heroui/table"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@heroui/modal"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT!

interface Member {
  id: string
  phone: string
  password: string
  email?: string
  first_name?: string
  last_name?: string
  is_admin: boolean
}

export default function AdminPanelPage() {
  const {
    isOpen: isCreateOpen,
    onOpen: openCreate,
    onOpenChange: onCreateChange
  } = useDisclosure()
  const {
    isOpen: isViewOpen,
    onOpen: openView,
    onOpenChange: onViewChange
  } = useDisclosure()
  const [viewMember, setViewMember] = useState<Member | null>(null)

  const [members, setMembers] = useState<Member[]>([])
  const [page, setPage] = useState(1)
  const [perPage] = useState(5)
  const [total, setTotal] = useState(0)
  const pages = Math.ceil(total / perPage)

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
    onCreateChange()
  }

  async function load() {
    try {
      const res = await fetch(
        `${API_HOST}:${API_PORT}/members?page=${page}&per_page=${perPage}`,
        {
          credentials: "include"
        }
      )
      if (!res.ok) throw new Error("Échec du chargement")
      const data: Member[] = await res.json()
      setMembers(data)
      setTotal(data.length)
    } catch (err) {
      console.error(err)
      addToast({
        title: "Impossible de charger les membres.",
        color: "danger"
      })
    }
  }

  // Charger la page courante
  useEffect(() => {
    load()
  }, [page])

  // Supprimer un membre
  const deleteMember = async (id: string) => {
    if (!confirm("Supprimer ce membre ?")) return
    try {
      const res = await fetch(`${API_HOST}:${API_PORT}/member/${id}`, {
        method: "DELETE",
        credentials: "include"
      })
      if (!res.ok) throw new Error()
      addToast({ title: "Membre supprimé.", color: "success" })
      // Recharger la page courante
      load()
      setPage(1)
    } catch {
      addToast({ title: "Erreur de suppression.", color: "danger" })
    }
  }

  // Ouvrir modal de vue
  const onView = (m: Member) => {
    setViewMember(m)
    openView()
  }

  return (
    <>
      <h1 className="font-bold text-xl my-4">Administration</h1>

      {/* Bouton Ajouter */}
      <Button color="primary" onClick={openCreate}>
        Ajouter un membre
      </Button>

      <Table aria-label="member table" className="mt-6" isStriped>
        <TableHeader>
          <TableColumn>N° de téléphone</TableColumn>
          <TableColumn>Prénom</TableColumn>
          <TableColumn>Nom</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {members.map(m => (
            <TableRow key={m.id}>
              <TableCell>+{m.phone || "-"}</TableCell>
              <TableCell>{m.first_name || "-"}</TableCell>
              <TableCell>{m.last_name || "-"}</TableCell>
              <TableCell className="flex gap-2">
                <span
                  className="text-lg text-default-400 cursor-pointer"
                  onClick={() => {
                    setViewMember(m)
                    openView()
                  }}
                >
                  <LuEye />
                </span>
                <span
                  className="text-lg text-danger cursor-pointer"
                  onClick={() => deleteMember(m.id)}
                >
                  <LuTrash2 />
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination
        current={page}
        total={pages}
        onChange={p => setPage(p)}
        className="mt-4"
      />

      <Modal
        isOpen={isCreateOpen}
        onOpenChange={handleModalClose}
        isDismissable={false}
        isKeyboardDismissDisabled
        placement="center"
        size="xs"
        closeButton={<div />}
      >
        <ModalContent>
          {onClose => (
            <>
              {!showSuccessScreen ? (
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

      <Modal
        isDismissable={false}
        isKeyboardDismissDisabled
        isOpen={isViewOpen}
        onOpenChange={onViewChange}
        placement="center"
        size="sm"
        closeButton={<div />}
      >
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader>Informations du membre</ModalHeader>
              <ModalBody className="space-y-2">
                <p>
                  <strong>ID :</strong> {viewMember?.id}
                </p>
                <p>
                  <strong>Téléphone :</strong> +{viewMember?.phone}
                </p>
                <p>
                  <strong>Email :</strong> {viewMember?.email || "-"}
                </p>
                <p>
                  <strong>Prénom :</strong> {viewMember?.first_name || "-"}
                </p>
                <p>
                  <strong>Nom :</strong> {viewMember?.last_name || "-"}
                </p>
                <p>
                  <strong>Rôle :</strong>{" "}
                  {viewMember?.is_admin ? "Administrateur" : "Adhérent"}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button onPress={onClose}>Fermer</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
