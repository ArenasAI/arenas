"use client"

import { VisualizationData } from '../types';
import { VisualizationGenerator } from '../visualization-generator';
import { Card, CardContent } from '@/components/ui/card';

interface VisualizationMessageProps {
  content: VisualizationData;
}

export function VisualizationMessage({ content }: VisualizationMessageProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <VisualizationGenerator 
          fileUrl={content.fileUrl}
          fileName={content.fileName}
          fileType={content.fileType}
          documentId={content.documentId}
          userId={content.userId}
          query={content.query}
          chatId={content.chatId || ""}
        />
      </CardContent>
    </Card>
  );
}
