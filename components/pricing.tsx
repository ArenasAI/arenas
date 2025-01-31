"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { dela } from "./ui/fonts"

export default function PricingPage() {
  return (
    <div className={` ${dela.className} min-h-screen`}>

      <div className="max-w-4xl mx-auto text-center mt-20 px-4">
        <h1 className="text-white text-2xl md:text-6xl font-bold mb-4 leading-tight">
          don&apos;t waste your time on boring data analysis
        </h1>
        <h1 className="text-white text-3xl md:text-5xl font-bold tracking-wider">
          LEAVE IT TO US!
        </h1>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 px-4 pb-20">
        {/* Student Tier */}
        <Card className="bg-[#333333] border-0 rounded-3xl">
          <CardContent className="p-8 flex flex-col items-center text-center h-full">
            <h3 className="text-white text-2xl font-bold mb-2">student</h3>
            <p className="text-white text-sm mb-8">take it all !!!!!!!!!!!</p>
            <div className="text-white text-5xl font-bold mb-auto">FREE</div>
            <Button className="w-full bg-white text-black hover:bg-gray-100 rounded-xl mt-8 font-bold text-lg">
              GET IT
            </Button>
          </CardContent>
        </Card>

        {/* Pro Tier */}
        <Card className="bg-[#333333] border-0 rounded-3xl">
          <CardContent className="p-8 flex flex-col items-center text-center h-full">
            <h3 className="text-white text-2xl font-bold mb-2">pro</h3>
            <p className="text-white text-sm mb-8">for pros out there looking for help lol</p>
            <div className="flex flex-col text-white">
              <div className="text-5xl font-bold">$40</div>
              <div className="text-2xl font-bold">/MONTH</div>
            </div>
            <Button className="w-full bg-white text-black hover:bg-gray-100 rounded-xl mt-8 font-bold text-lg">
              GET IT
            </Button>
          </CardContent>
        </Card>

        {/* Premium Pro Tier */}
        <Card className="bg-[#333333] border-0 rounded-3xl">
          <CardContent className="p-8 flex flex-col items-center text-center h-full">
            <h3 className="text-white text-2xl font-bold mb-2">enterprise!</h3>
            <p className="text-white text-sm mb-8">DONT TAKE ME FOR GRANTED!</p>
            <div className="flex flex-col text-white">
              <div className="text-5xl font-bold">$100</div>
              <div className="text-2xl font-bold">/MONTH</div>
            </div>
            <Button className="w-full bg-white text-black hover:bg-gray-100 rounded-xl mt-8 font-bold text-lg">
              GET IT
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

