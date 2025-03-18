import { GitHubLogo, LinkedInLogo, DiscordLogo, TwitterLogo } from "@/components/ui/icons";
import { PricingTierData } from "@/lib/pricing";
import { InstagramLogoIcon } from "@radix-ui/react-icons";

export const CONTACT_EMAIL = "witharenas@gmail.com";

export const MAX_MESSAGES = "15";

export const isProductionEnvironment = process.env.NODE_ENV === 'production';

export const PRICING_TIERS: {
    monthly: PricingTierData[],
    annual: PricingTierData[],
} = {
    monthly: [
        {
            title: "Student",
            price: "15",
            description: "Perfect for students and beginners",
            priceId: process.env.NEXT_PUBLIC_STRIPE_STUDENT_PRICE_ID,
            features: ["15 messages free","Community Discord access", "Basic data visualization", "R and Julia (incoming)"],
            index: 0,
        },
        {
            title: "Pro",
            price: "40",
            description: "For professionals who need powerful tools",
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
            features: ["Unlimited messages", "Discord priority support", "Advanced visualizations", "Unlimited MCP Access"],
            index: 1,
        },
        // {
        //     title: "Team",
        //     price: "80",
        //     description: "Ideal for teams and organizations",
        //     priceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID,
        //     features: ["Unlimited access to chat", "Access to latest models", "Single Sign On - SSO", "Custom dashboards", "Direct customer support from team", "Long term file storage"],
        //     index: 2,
        // }
    ],

    annual: [
        {
            title: "Student",
            price: "10",
            description: "Perfect for students and beginners",
            priceId: process.env.NEXT_PUBLIC_STRIPE_STUDENT_ANNUAL_PRICE_ID,
            features: ["100 monthly messages", "Community Discord access" , "Basic data visualization", "R and Julia (incoming)"],
            index: 0
        },
        {
            title: "Pro",
            price: "34",
            description: "For professionals who need powerful tools",
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID,
            features: ["Unlimited messages", "Discord priority support", "Advanced visualizations", "Unlimited MCP Access"],
            index: 1
        },
        // {
        //     title: "Team",
        //     price: "68",
        //     description: "Ideal for teams and organizations",
        //     priceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_ANNUAL_PRICE_ID,
        //     features: ["Unlimited access to chat", "Access to latest models", "Single Sign On - SSO", "Custom dashboards", "Direct customer support from team", "Long term file storage"],
        //     index: 2
        // }, 
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