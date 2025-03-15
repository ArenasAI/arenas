import { GitHubLogo, LinkedInLogo, DiscordLogo, TwitterLogo } from "@/components/ui/icons";
import { PricingTierData } from "@/lib/pricing";
import { InstagramLogoIcon } from "@radix-ui/react-icons";

export const CONTACT_EMAIL = "witharenas@gmail.com";

export const MAX_MESSAGES = "15";

export const isProductionEnvironment = process.env.NODE_ENV === 'production';

export const TEST_MODE_ENABLED = ["true", "True", "TRUE"].includes(
    process.env.NEXT_PUBLIC_TEST_MODE_ENABLED ?? "",
  );

export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT,
);

export const PRICING_TIERS: {
    monthly: PricingTierData[],
    annual: PricingTierData[],
} = {
    monthly: [
        {
            title: "Student",
            price: "15",
            description: "Perfect for students and beginners",
            features: ["Community Discord access", "15 messages free", "Basic data visualization", "CSV & Excel support"],
            index: 0,
        },
        {
            title: "Pro",
            price: "40",
            description: "For professionals who need powerful tools",
            features: ["Monthly 100 messages", "Discord priority support", "Advanced visualizations", "API access", "Contributing"],
            index: 1,
        },
        {
            title: "Team",
            price: "80",
            description: "Ideal for teams and organizations",
            features: ["Unlimited access to chat", "Latest AI models", "Team collaboration", "Custom dashboards", "Long term file storage"],
            index: 2,
        }
    ],

    annual: [
        {
            title: "Student",
            price: "12.99",
            description: "Perfect for students and beginners",
            features: ["Community Discord access", "15 messages free", "Basic data visualization", "CSV & Excel support"],
            index: 0
        },
        {
            title: "Pro",
            price: "34.99",
            description: "For professionals who need powerful tools",
            features: ["Monthly 100 messages", "Discord priority support", "Advanced visualizations", "API access", "Contributing"],
            index: 1
        },
        {
            title: "Team",
            price: "68.99",
            description: "Ideal for teams and organizations",
            features: ["Unlimited access to chat", "Latest AI models", "Team collaboration", "Custom dashboards", "Long term file storage"],
            index: 2
        }, 
    ]
}


export const socialLinks = [
    {
        icon: DiscordLogo,
        link: 'https://discord.gg/spZ5yucbnn'

    },
    {
        icon: LinkedInLogo,
        link: 'https://www.linkedin.com/company/arenasai/',
    },
    {
        icon: TwitterLogo,
        link: 'https://x.com/witharenas',
    },
    {
        icon: InstagramLogoIcon,
        link: 'https://www.instagram.com/witharenas/'
    },
    {
        icon: GitHubLogo,
        link: "https://github.com/ArenasAI",
    },
]