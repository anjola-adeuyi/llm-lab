'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ExperimentForm } from '@/components/experiment-form';
import { Toast, useToast } from '@/components/toast';
import { LoadingOverlay } from '@/components/loading-overlay';
import { GenerateRequest } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: GenerateRequest) => {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate responses');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate experiments list
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      showToast('Responses generated successfully!', 'success');
      // Navigate to experiment detail page
      setTimeout(() => {
        router.push(`/experiments/${data.experimentId}`);
      }, 1000);
    },
    onError: (error: Error) => {
      showToast(error.message, 'error');
    },
  });

  return (
    <>
      <LoadingOverlay isLoading={mutation.isPending} />
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">LLM Lab</h1>
          <p className="text-muted-foreground">Experiment with LLM parameters and compare response quality metrics</p>
        </div>

        <ExperimentForm
          onSubmit={(data) => mutation.mutate(data)}
          isLoading={mutation.isPending}
        />

        <div className="mt-8">
          <a
            href="/experiments"
            className="text-primary hover:underline"
            aria-label="View all experiments"
          >
            View all experiments →
          </a>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
      </div>
    </>
  );
}
