import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/nav";

export default function FilesPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="flex flex-col items-center justify-center h-full">
                <Navbar />
            </div>
            <div className="flex flex-col items-center justify-center p-40 h-full">
                <h3 className="text-2xl font-semibold text-center">your uploaded files will be visible here</h3>
            </div>
        </div>
    )
}