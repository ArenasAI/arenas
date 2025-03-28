"use client"

import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

export default function PricingSuccess() {
    const router = useRouter();
    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-screen"
        >
            <h1>Thank you for your purchase!</h1>
            <p>Your subscription has been successfully created.</p>
            <Button 
            className="mx-auto mt-4"
            onClick={() => router.push('/you')}>
                Go to Dashboard
            </Button>
        </motion.div>
    )
}