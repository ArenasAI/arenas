import { GitHubLogo, LinkedInLogo, DiscordLogo, TwitterLogo } from "@/components/ui/icons";
import { PricingTierData } from "@/lib/pricing";
import { InstagramLogoIcon } from "@radix-ui/react-icons";

export const CONTACT_EMAIL = "witharenas@gmail.com";

export const MAX_MESSAGES = "15";

export const isProductionEnvironment = process.env.NODE_ENV === 'production';

export const TEST_MODE_ENABLED = ["true", "True", "TRUE"].includes(process.env.NEXT_PUBLIC_TEST_MODE_ENABLED ?? '');

export const STRIPE_IDS = {
    STUDENT: {
        MONTHLY: TEST_MODE_ENABLED ? process.env.NEXT_PUBLIC_STRIPE_STUDENT_MONTHLY_TEST_ID : process.env.NEXT_PUBLIC_STRIPE_STUDENT_MONTHLY_PRICE_ID,
        ANNUAL: TEST_MODE_ENABLED ? process.env.NEXT_PUBLIC_STRIPE_STUDENT_ANNUAL_TEST_ID : process.env.NEXT_PUBLIC_STRIPE_STUDENT_ANNUAL_PRICE_ID,
    },
    PRO: {
        MONTHLY: TEST_MODE_ENABLED ? process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_TEST_ID : process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
        ANNUAL: TEST_MODE_ENABLED ? process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_TEST_ID : process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID,
    }
};

export const PRICING_TIERS = {
    monthly: [
        {
            title: "Student",
            price: "25",
            description: "Perfect for students and beginners",
            priceId: STRIPE_IDS.STUDENT.MONTHLY,
            features: ["15 messages free", "Community Discord access", "Basic data visualization", "R and Julia (incoming)"],
            index: 0,
        },
        {
            title: "Pro",
            price: "50",
            description: "For professionals who need powerful tools",
            priceId: STRIPE_IDS.PRO.MONTHLY,
            features: ["Unlimited messages", "Discord priority support", "Advanced visualizations", "Unlimited MCP Access"],
            index: 1,
        },
    ],
    annual: [
        {
            title: "Student",
            price: "20",
            description: "Perfect for students and beginners",
            priceId: STRIPE_IDS.STUDENT.ANNUAL,
            features: ["100 monthly messages", "Community Discord access", "Basic data visualization", "R and Julia (incoming)"],
            index: 0
        },
        {
            title: "Pro",
            price: "40",
            description: "For professionals who need powerful tools",
            priceId: STRIPE_IDS.PRO.ANNUAL,
            features: ["Unlimited messages", "Discord priority support", "Advanced visualizations", "Unlimited MCP Access"],
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