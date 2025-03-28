import { Navbar } from "@/components/nav";
import { constructMetadata } from "@/lib/utils";
import updates from "./changelog";


export const metadata = constructMetadata({
    title: "Changelog",
    description: "Changelog",
    canonical: "/changelog",
});


const ChangelogPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center pt-20">
            <Navbar />
            <h1 className="text-2xl font-bold">Changelog</h1>
            <div className="flex flex-col items-center justify-center">
                {updates.map((update) => (
                    <div key={update.version}>
                        <h2 className="text-xl font-bold pt-4">{update.version}</h2>
                        <p>{update.description}</p>
                        <span className="text-sm text-muted-foreground">{update.date}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ChangelogPage;