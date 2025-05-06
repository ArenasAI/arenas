import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com";

const pages: Array<{
    route: string;
    priority: number;
    changefreq:
        | "always"
        | "hourly"
        | "daily"
        | "weekly"
        | "monthly"
        | "yearly"
        | "never";
}> = [
    { route: "/", priority: 1, changefreq: "daily" },
    { route: "/about", priority: 0.8, changefreq: "monthly" },
    { route: "/blog", priority: 0.8, changefreq: "weekly" },
    { route: "/blog/[slug]", priority: 0.7, changefreq: "weekly" },
    { route: "/pricing", priority: 0.9, changefreq: "monthly" },
    { route: "/privacy", priority: 0.5, changefreq: "yearly" },
    { route: "/terms", priority: 0.5, changefreq: "yearly" },
    { route: "/changelog", priority: 0.6, changefreq: "monthly" },
    { route: "/usecases", priority: 0.8, changefreq: "monthly" },
    { route: "/docs", priority: 0.8, changefreq: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
    return pages.map(({route, priority, changefreq}) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date().toISOString(),
        changefreq,
        priority,
    }));
}