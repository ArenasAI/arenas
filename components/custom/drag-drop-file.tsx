import React, {useState} from "react";

const DragDrop = () => {
    const [file, setFile] = useState<File | null>(null);

    const handleDrop = (event: ReactDragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.dataTransfer.files.length) {
            setFile(event.dataTransfer.files[0]);
        }
    };

    return (
        <div
            onDragOver={(e) => e.preventDefault()}
            onDrop = {handleDrop}
            className = "border-2 border-dashed p-6 text-center"
        >
            {file ? <p>{file.name}</p> : <p>Drag and drop files!</p>}
        </div>
    )
}

export default DragDrop;