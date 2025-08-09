"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { title } from "@/components/primitives";
import { Button, Accordion, AccordionItem } from "@heroui/react";
import { notFound } from "next/navigation";

type Reservation = {
  id: string;
  court_number: number;
  reservation_time: number;
  member_id: string;
  member_name: string;
};

export default function PlanningPage() {
  const router = useRouter();
  const { date } = useParams() as { date?: string };
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [displayDate, setDisplayDate] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!date) return setError(true);

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return setError(true);

    const dt = new Date(date);
    if (dt.toISOString().split("T")[0] !== date) return setError(true);

    setDisplayDate(
      dt.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    );

    // Mock reservations
    setReservations([
      { id: "A1", court_number: 1, reservation_time: 16, member_id: "M001", member_name: "John Doe" },
      { id: "B2", court_number: 3, reservation_time: 18, member_id: "M002", member_name: "Jane Smith" },
    ]);
  }, [date]);

  if (error) notFound();

  const navDay = (offset: number) => {
    const dt = new Date(date!);
    dt.setDate(dt.getDate() + offset);
    const newDate = dt.toISOString().split("T")[0];
    router.push(`/planning/${newDate}`);
  };

  const handleReservation = (hour: number, court: number) => {
    console.log(`Réserver terrain ${court} à ${hour}h le ${date}`);
  };

  return (
    <div>
      <h1 className={title()}>Planning</h1>
      <div className="flex items-center gap-4 my-4">
        <Button size="sm" onClick={() => navDay(-1)}>{"<"}</Button>
        <span className="font-semibold">{displayDate}</span>
        <Button size="sm" onClick={() => navDay(1)}>{">"}</Button>
      </div>

      <Accordion variant="splitted">
        {[16, 17, 18, 19, 20].map((hour) => (
          <AccordionItem key={hour} title={`${hour}h`} aria-label={`${hour}h`}>
            <div>
              <span>Terrains</span>
              {[1, 2, 3, 4].map((court) => {
                const res = reservations.find(
                  (r) => r.reservation_time === hour && r.court_number === court
                );
                return (
                  <div
                    key={court}
                    className="w-full flex justify-between items-center mt-2 ml-2"
                  >
                    <span>{court}</span>
                    {res ? (
                      <span className="text-gray-500 ">
                        Réservé par {res.member_name}
                      </span>
                    ) : (
                      <Button
                        color="primary"
                        size="sm"
                        onClick={() => handleReservation(hour, court)}
                      >
                        Réserver
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
