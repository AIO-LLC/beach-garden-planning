import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";

export default function Home() {
  return (
      <ul>
        <li>
          <Link
            className={buttonStyles({
              color: "primary",
              radius: "full",
              variant: "shadow",
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
  );
}
