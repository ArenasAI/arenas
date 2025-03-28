import 'server-only';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';

import createClient from '@/lib/supabase/server';

import {
  getChatByIdQuery,
  getUserQuery,
  getChatsByUserIdQuery,
  getMessagesByChatIdQuery,
  getVotesByChatIdQuery,
  getDocumentByIdQuery,
  getDocumentsByIdQuery,
  getSuggestionsByDocumentIdQuery,
  getSessionQuery,
  getUserByIdQuery,
  getChatWithMessagesQuery,
  getFilesQuery,
} from './queries';

const getSupabase = cache(() => createClient());

export const getSession = async () => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getSessionQuery(supabase);
    },
    ['session'],
    {
      tags: [`session`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getUserById = async (id: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getUserByIdQuery(supabase, id);
    },
    [`user_by_id`, id.slice(2, 12)],
    {
      tags: [`user_by_id_${id.slice(2, 12)}`],

      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getUser = async (email: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getUserQuery(supabase, email);
    },
    ['user', email],
    {
      tags: [`user_${email}`],
      revalidate: 3600, // Cache for 1 hour
    }
  )();
};

export const getFiles = async (id: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getFilesQuery(supabase, { id: id });
    },
    ['files', id],
    {
      tags: [`files_${id}`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getChatById = async (chatId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getChatByIdQuery(supabase, { id: chatId });
    },
    ['chat', chatId],
    {
      tags: [`chat_${chatId}`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getChatsByUserId = async (userId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getChatsByUserIdQuery(supabase, { id: userId });
    },
    ['chats', userId],
    {
      tags: [`user_${userId}_chats`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getMessagesByChatId = async (chatId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getMessagesByChatIdQuery(supabase, { id: chatId });
    },
    ['messages', chatId],
    {
      tags: [`chat_${chatId}_messages`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getVotesByChatId = async (chatId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getVotesByChatIdQuery(supabase, { id: chatId });
    },
    ['votes', chatId],
    {
      tags: [`chat_${chatId}_votes`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getDocumentById = async (documentId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getDocumentByIdQuery(supabase, { id: documentId });
    },
    ['document', documentId],
    {
      tags: [`document_${documentId}`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getDocumentsById = async (documentId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getDocumentsByIdQuery(supabase, { id: documentId });
    },
    ['documents', documentId],
    {
      tags: [`document_${documentId}_versions`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getSuggestionsByDocumentId = async (documentId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getSuggestionsByDocumentIdQuery(supabase, {
        documentId: documentId,
      });
    },
    ['suggestions', documentId],
    {
      tags: [`document_${documentId}_suggestions`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getChatWithMessages = async (chatId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getChatWithMessagesQuery(supabase, { id: chatId });
    },
    ['chat_with_messages', chatId],
    {
      tags: [`chat_${chatId}`, `chat_${chatId}_messages`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

// export const getCachedContext = unstable_cache(
//   async (fileReference: string) => {
//     const supabase = await getSupabase();
//     try {
//       // Use the fileReference as the cache key
//       const { data } = await supabase
//         .from('files')
//         .select('context')
//         .eq('reference', fileReference)
//         .single();
      
//       return data?.context || null;
//     } catch (error) {
//       console.error('Error fetching context:', error);
//       return null;
//     }
//   },
//   ['file_context'],
//   {
//     tags: ['file_context'],
//     revalidate: 3600 // Cache for 1 hour
//   }
// );

// export const cacheContext = async (fileReference: string, context: string) => {
//   const supabase = await getSupabase();
//   try {
//     await supabase
//       .from('files')
//       .upsert({
//         reference: fileReference,
//         context,
//         updated_at: new Date().toISOString()
//       });
//   } catch (error) {
//     console.error('Error caching context:', error);
//   }
// };

// export const getCachedFile = unstable_cache(
//   async (hash: string) => {
//     const supabase = await getSupabase();
//     try {
//       const { data } = await supabase
//         .from('files')
//         .select('*')
//         .eq('hash', hash)
//         .single();
      
//       return data;
//     } catch (error) {
//       console.error('Error fetching file:', error);
//       return null;
//     }
//   },
//   ['file_data'],
//   {
//     tags: ['file_data'],
//     revalidate: 3600 // Cache for 1 hour
//   }
// );

// export const cacheFile = async (hash: string, fileData: {
//   url: string;
//   path: string;
//   contentType: string;
//   tableData?: any;
// }) => {
//   const supabase = await getSupabase();
//   try {
//     await supabase
//       .from('files')
//       .upsert({
//         hash,
//         ...fileData,
//         updated_at: new Date().toISOString()
//       });
//   } catch (error) {
//     console.error('Error caching file:', error);
//   }
// };