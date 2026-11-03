import { SITE_URL } from "@/lib/site-url"
import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/confirm/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
