export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "Beach Garden",
  description: "Réservez un terrain en ligne !",
  navItems: [
    {
      label: "Accueil",
      href: "/"
    },
    {
      label: "Devenir adhérent",
      href: "/signup"
    },
    {
      label: "Se connecter",
      href: "/login"
    },
    {
      label: "Planning",
      href: "/planning"
    }
  ],
  navMenuItems: [
    {
      label: "Accueil",
      href: "/"
    },
    {
      label: "Devenir adhérent",
      href: "/signup"
    },
    {
      label: "Se connecter",
      href: "/login"
    },
    {
      label: "Planning",
      href: "/planning"
    }
  ],
  links: {
    instagram: "https://instagram.com/beachgardensxm"
  }
}
