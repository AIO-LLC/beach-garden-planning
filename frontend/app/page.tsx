import { Link } from "@heroui/link"
import { button as buttonStyles } from "@heroui/theme"

export default function Home() {
  return (
    <ul>
      <li>
        <Link
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow"
          })}
          href="/signup"
        >
          Devenir adhérent
        </Link>
      </li>
      <li>
        <Link
          className={buttonStyles({ variant: "bordered", radius: "full" })}
          href="/planning"
        >
          Réserver un terrain
        </Link>
      </li>
    </ul>
  )
}
