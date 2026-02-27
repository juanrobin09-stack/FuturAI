import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/settings/", "/sign-in/", "/sign-up/"],
      },
    ],
    sitemap: "https://futurai.space/sitemap.xml",
  };
}
