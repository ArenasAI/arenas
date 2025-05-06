import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/", "/changelog", "/privacy"],
        },
        sitemap: "https://yourdomain.com/sitemap.xml",
    }
}