"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button, Accordion, AccordionItem } from "@heroui/react"
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
    useState<boolean>(false) // I added this but I don't know how to update it

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

        if (currentUserId) {
          const has = reservationsData.some(
            reservation => reservation.member_id === currentUserId
          )

          setCurrentUserHasReservation(has)
        }
      }
    )
  }, [date, currentUserId])

  if (error) notFound()

  const navDay = (offset: number) => {
    const dt = new Date(date!)

    dt.setDate(dt.getDate() + offset)
    const newDate = dt.toISOString().split("T")[0]

    router.push(`/planning/${newDate}`)
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
      const url = `${API_HOST}:${API_PORT}/reservation`
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error(`Erreur ${response.status}`)
      else {
        location.reload()
      }
    } catch (err: any) {
      console.error(err)
    }
  }

  const handleCancelReservation = async (reservationId: string) => {
    try {
      const url = `${API_HOST}:${API_PORT}/reservation/${reservationId}`
      const response = await fetch(url, {
        method: "DELETE",
        credentials: "include"
      })

      if (!response.ok) throw new Error(`Erreur ${response.status}`)
      else {
        location.reload()
      }
    } catch (err: any) {
      console.error(err)
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
        {[16, 17, 18, 19, 20].map(hour => (
          <AccordionItem key={hour} aria-label={`${hour}h`} title={`${hour}h`}>
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
                            Réservé par {res.member_first_name}{" "}
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
        ))}
      </Accordion>
    </div>
  )
}
