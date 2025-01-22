import { GitHubLogo, LinkedInLogo, DiscordLogo, TwitterLogo } from "@/components/ui/icons";
import { PricingTierData } from "@/lib/pricing";
import { InstagramLogoIcon } from "@radix-ui/react-icons";

export const CONTACT_EMAIL = "witharenas@gmail.com";

export const MAX_MESSAGES = "15";

export const PRICING_TIERS: {
    monthly: PricingTierData[],
    annual: PricingTierData[],
} = {
    monthly: [
        {
            title: "Student",
            price: "10",
            description: "dont worry about using R studio now, we gotchu.",
            features: ["community discord server", "15 messages free"],
            index: 0,
        },
        {
            title: "Pro",
            price: "40",
            description: "automate tedious tasks at work",
            features: ["monthly 100 messages", "discord server", "contributing"],
            index: 1,
        },
        {
            title: "Team",
            price: "80",
            description: "get one for your whole team and be merry",
            features: ["unlimited access to chat", "latest models", "long term file storage"],
            index: 2,
        }
    ],

    annual: [
        {
            title: "Student",
            price: "100",
            description: "pay once, rejoice everyday!",
            features: ['discord server', 'unlimited access to chat'],
            index: 1
        },
        {
            title: "Pro",
            price: "840",
            description: "pay once, rejoice everyday!",
            features: ['discord server', 'unlimited access to chat'],
            index: 1
        },
        {
            title: "Student",
            price: "1000",
            description: "pay once, rejoice everyday!",
            features: ['discord server', 'unlimited access to chat'],
            index: 1
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