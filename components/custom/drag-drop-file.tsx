import React, { useState, useRef, DragEvent } from 'react';

export function DragDropFile({
  onFilesDrop,
  className,
  children,
}: {
  onFilesDrop: (files: File[]) => void;
  className?: string;
  children?: React.ReactNode;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      onFilesDrop(files);
    }
  };

  return (
    <div
      ref={dropRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        ${className} 
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        border-2 border-dashed rounded-lg p-4 transition-colors duration-200
      `}
    >
      {children || (
        <p className="text-center text-gray-500">
          Drag and drop files here or click to upload
        </p>
      )}
    </div>
  );
}