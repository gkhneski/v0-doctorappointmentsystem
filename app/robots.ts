import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vu7p6h.v0prod.app"

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
