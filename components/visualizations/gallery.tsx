import { useState } from 'react';
import { useVisualizations, useDeleteVisualization } from '@/lib/hooks/use-visualizations';
import { DataVisualization } from './plot';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { generatePlotFromData } from '@/lib/utils';

interface VisualizationGalleryProps {
  chatId?: string;
}

export function VisualizationGallery({ chatId }: VisualizationGalleryProps) {
  const { data: visualizations, isLoading, error } = useVisualizations(chatId);
  const { mutate: deleteVisualization } = useDeleteVisualization();
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="p-4">
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="p-0">
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
            <CardFooter className="p-4">
              <Skeleton className="h-4 w-1/2" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
  
  if (error) {
    return <div className="text-red-500">Error loading visualizations: {error.message}</div>;
  }
  
  if (!visualizations?.length) {
    return <div className="text-muted-foreground">No visualizations found.</div>;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {visualizations.map((viz) => (
        <Card key={viz.id} className="overflow-hidden">
          <CardHeader className="p-4">
            <CardTitle className="text-lg truncate">{viz.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[200px]">
            <DataVisualization 
              data={generatePlotFromData(
                viz.data || [],
                viz.config.xField,
                viz.config.yField,
                viz.config.type === 'line' ? 'scatter' : viz.config.type,
                {
                  title: '',
                  colorField: viz.config.colorField,
                  groupBy: viz.config.groupBy
                }
              ).data}
              layout={{
                title: '',
                margin: { t: 10, r: 10, b: 30, l: 40 },
                autosize: true
              }}
              config={{ displayModeBar: false }}
            />
          </CardContent>
          <CardFooter className="p-4 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {format(new Date(viz.created_at), 'MMM d, yyyy')}
            </span>
            <div className="flex gap-2">
              <Link href={`/visualizations/${viz.id}`} passHref>
                <Button size="sm" variant="ghost">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/visualizations/${viz.id}/edit`} passHref>
                <Button size="sm" variant="ghost">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Visualization</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this visualization? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteVisualization(viz.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 