"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button, Accordion, AccordionItem, addToast } from "@heroui/react"
import { notFound } from "next/navigation"

import { title } from "@/components/primitives"

type Reservation = {
  id: string
  member_id: string
  court_number: number
  reservation_time: number
  reservation_date: string
  member_first_name: string
  member_last_name: string
}

const API_HOST = process.env.NEXT_PUBLIC_API_HOST!
const API_PORT = process.env.NEXT_PUBLIC_API_PORT!

export default function PlanningDatePage() {
  const router = useRouter()
  const { date } = useParams() as { date?: string }
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [displayDate, setDisplayDate] = useState("")
  const [error, setError] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserHasReservation, setCurrentUserHasReservation] =
    useState<boolean>(false)

  useEffect(() => {
    if (!date) return setError(true)

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/

    if (!dateRegex.test(date)) return setError(true)

    const [year, month, day] = date.split("-").map(Number)
    const dt = new Date(year, month - 1, day)

    if (dt.toISOString().split("T")[0] !== date) return setError(true)

    setDisplayDate(
      dt.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long"
      })
    )

    const getCurrentUser = async () => {
      try {
        const response = await fetch(`${API_HOST}:${API_PORT}/jwt-claims`, {
          method: "GET",
          credentials: "include"
        })

        if (response.ok) {
          const { id } = await response.json()

          setCurrentUserId(id)
        }
      } catch (err) {
        console.error("Error getting current user:", err)
      }
    }

    const get_reservations_from_date = async (date: string) => {
      try {
        const url = `${API_HOST}:${API_PORT}/reservations/${date}`
        const response = await fetch(url, {
          method: "get",
          credentials: "include"
        })

        if (!response.ok) {
          console.log(response.status)

          return []
        }

        const reservations_from_db: Reservation[] = await response.json()

        return reservations_from_db
      } catch (err: any) {
        console.error(err)

        return []
      }
    }

    Promise.all([getCurrentUser(), get_reservations_from_date(date)]).then(
      ([_, reservationsData]) => {
        setReservations(reservationsData || [])
      }
    )
  }, [date])

  // Update currentUserHasReservation whenever reservations or currentUserId changes
  useEffect(() => {
    if (currentUserId) {
      setCurrentUserHasReservation(
        reservations.some(r => r.member_id === currentUserId)
      )
    } else {
      setCurrentUserHasReservation(false)
    }
  }, [reservations, currentUserId])

  if (error) notFound()

  const navDay = (offset: number) => {
    const dt = new Date(date!)

    dt.setDate(dt.getDate() + offset)
    const newDate = dt.toISOString().split("T")[0]

    router.push(`/planning/${newDate}`)
  }

  async function refreshReservations(
    date: string,
    setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>
  ) {
    try {
      const url = `${API_HOST}:${API_PORT}/reservations/${date}`
      const response = await fetch(url, {
        method: "GET",
        credentials: "include"
      })

      if (!response.ok) throw new Error(`Fetch failed ${response.status}`)
      const data: Reservation[] = await response.json()

      setReservations(data)
    } catch (err) {
      console.error("Error refreshing reservations:", err)
    }
  }

  const handleReservation = async (hour: number, court: number) => {
    if (!currentUserId) return

    const payload = {
      id: "",
      member_id: currentUserId,
      court_number: court,
      reservation_date: date,
      reservation_time: hour
    }

    try {
      const response = await fetch(`${API_HOST}:${API_PORT}/reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error(`Erreur ${response.status}`)

      addToast({
        title: "Votre réservation a été enregistrée.",
        color: "success"
      })

      await refreshReservations(date!, setReservations)
    } catch (err: any) {
      console.error(err)
      addToast({
        title:
          "Une erreur est survenue lors de la réservation. Veuillez réessayer plus tard.",
        color: "danger"
      })
    }
  }

  const handleCancelReservation = async (reservationId: string) => {
    try {
      const response = await fetch(
        `${API_HOST}:${API_PORT}/reservation/${reservationId}`,
        {
          method: "DELETE",
          credentials: "include"
        }
      )

      if (!response.ok) throw new Error(`Erreur ${response.status}`)

      addToast({
        title: "Votre réservation a été annulée."
      })
      await refreshReservations(date!, setReservations)
    } catch (err: any) {
      console.error(err)
      addToast({
        title:
          "Une erreur est survenue lors de l'annulation de votre réservation. Veuillez réessayer plus tard.",
        color: "danger"
      })
    }
  }

  return (
    <div>
      <h1 className={title()}>Planning</h1>
      <div className="flex items-center gap-4 my-4">
        <Button color="primary" size="sm" onClick={() => navDay(-1)}>
          {"<"}
        </Button>
        <span className="font-semibold">{displayDate}</span>
        <Button color="primary" size="sm" onClick={() => navDay(1)}>
          {">"}
        </Button>
      </div>

      <Accordion variant="splitted">
        {[16, 17, 18, 19, 20].map(hour => {
          // Calculate available courts for this hour
          const totalCourts = 4
          const reservedCourts = reservations.filter(
            r => r.reservation_time === hour
          ).length
          const availableCourts = totalCourts - reservedCourts
          let subtitleText = `${availableCourts}/${totalCourts} terrains libres`

          if (availableCourts === 1) {
            subtitleText = `1/${totalCourts} terrain libre`
          } else if (availableCourts === 0) {
            subtitleText = `Aucun terrain disponible`
          }

          return (
            <AccordionItem
              key={hour}
              aria-label={`${hour}h`}
              subtitle={subtitleText}
              title={`${hour}h`}
            >
              <div>
                <span>Terrains</span>
                {[1, 2, 3, 4].map(court => {
                  const res = reservations.find(
                    r => r.reservation_time === hour && r.court_number === court
                  )

                  return (
                    <div
                      key={court}
                      className="w-full flex justify-between items-center mt-2 ml-2"
                    >
                      <span>{court}</span>
                      {res ? (
                        <div className="flex items-center gap-2">
                          {currentUserId === res.member_id ? (
                            <Button
                              color="danger"
                              size="sm"
                              onClick={() => handleCancelReservation(res.id)}
                            >
                              Annuler
                            </Button>
                          ) : (
                            <span className="text-gray-500">
                              Réservé par {res.member_first_name[0]}.{" "}
                              {res.member_last_name}
                            </span>
                          )}
                        </div>
                      ) : (
                        !currentUserHasReservation && (
                          <Button
                            color="primary"
                            size="sm"
                            onClick={() => handleReservation(hour, court)}
                          >
                            Réserver
                          </Button>
                        )
                      )}
                    </div>
                  )
                })}
              </div>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
