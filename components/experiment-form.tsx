'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GenerateRequest } from '@/lib/types';

interface ExperimentFormProps {
  onSubmit: (data: GenerateRequest) => void;
  isLoading?: boolean;
}

export function ExperimentForm({ onSubmit, isLoading = false }: ExperimentFormProps) {
  const [prompt, setPrompt] = useState('');
  const [temperatureValues, setTemperatureValues] = useState<string>('0.1, 0.5, 0.9');
  const [topPValues, setTopPValues] = useState<string>('0.5, 0.9, 1.0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse parameter ranges
    const tempArray = temperatureValues
      .split(',')
      .map((v) => parseFloat(v.trim()))
      .filter((v) => !isNaN(v) && v >= 0 && v <= 2);

    const topPArray = topPValues
      .split(',')
      .map((v) => parseFloat(v.trim()))
      .filter((v) => !isNaN(v) && v >= 0 && v <= 1);

    if (tempArray.length === 0 || topPArray.length === 0) {
      alert('Please provide valid parameter values');
      return;
    }

    onSubmit({
      prompt,
      parameterRanges: {
        temperature: tempArray,
        topP: topPArray,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Experiment</CardTitle>
        <CardDescription>
          Enter a prompt and configure LLM parameters to generate and compare multiple responses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Enter your prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature Values (0-2, comma-separated)</Label>
              <Input
                id="temperature"
                type="text"
                placeholder="0.1, 0.5, 0.9"
                value={temperatureValues}
                onChange={(e) => setTemperatureValues(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Lower values = more focused, higher values = more creative
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topP">Top P Values (0-1, comma-separated)</Label>
              <Input
                id="topP"
                type="text"
                placeholder="0.5, 0.9, 1.0"
                value={topPValues}
                onChange={(e) => setTopPValues(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Controls diversity via nucleus sampling</p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? 'Generating...' : 'Generate Responses'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
