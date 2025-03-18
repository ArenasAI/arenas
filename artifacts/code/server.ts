import { z } from 'zod';
import { streamObject } from 'ai';
import { myProvider } from '@/ai/models';

import { systemPrompt, updateDocumentPrompt } from '@/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';

export const codeDocumentHandler = createDocumentHandler<'code'>({
  kind: 'code',
  onCreateDocument: async ({ title, dataStream, modelId }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel(modelId),
      system: systemPrompt,
      prompt: title,
      schema: z.object({
        code: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { code } = object;

        if (code) {
          dataStream.writeData({
            type: 'code-delta',
            content: code ?? '',
          });

          draftContent = code;
        }
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream, modelId }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel(modelId),
      system: updateDocumentPrompt(document.content, 'code'),
      prompt: description,
      schema: z.object({
        code: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { code } = object;

        if (code) {
          dataStream.writeData({
            type: 'code-delta',
            content: code ?? '',
          });

          draftContent = code;
        }
      }
    }

    return draftContent;
  },
});
