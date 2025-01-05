// // app/api/chat/route.ts
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
// import { cookies } from 'next/headers'
// import NextResponse from 'next/types'
// // import { OpenTelemetry } from '@opentelemetry/api'
// import { Redis } from '@upstash/redis'

// // Initialize Redis
// const redis = new Redis({
//   url: process.env.REDIS_URL!,
//   token: process.env.REDIS_TOKEN!,
// })

// // Model configurations
// const MODELS = {
//   arenas: {
//     id: 'arenas',
//     name: 'Arenas Model',
//     apiHandler: async (message: string) => {
//       // Your custom Arenas model logic
//       return /* model response */
//     }
//   },
//   llama: {
//     id: 'llama',
//     name: 'Llama 3.3',
//     apiHandler: async (message: string) => {
//       // Llama model integration
//     }
//   },
//   vertex: {
//     id: 'vertex',
//     name: 'Google Vertex',
//     apiHandler: async (message: string) => {
//       // Google Vertex AI integration
//     }
//   },
//   // Add other models similarly
// }

// // Telemetry setup
// const tracer = OpenTelemetry.trace.getTracer('chat-api')

// export async function POST(request: Request) {
//   const span = tracer.startSpan('chat-request')
  
//   try {
//     const supabase = createRouteHandlerClient({ cookies })
//     const { message, model } = await request.json()

//     // Auth check
//     const { data: { user }, error: authError } = await supabase.auth.getUser()
//     if (authError || !user) {
//       throw new Error('Unauthorized')
//     }

//     // Validate model selection
//     if (!MODELS[model]) {
//       throw new Error('Invalid model selected')
//     }

//     // Cache check
//     const cacheKey = `chat:${user.id}:${message.substring(0, 32)}`
//     const cachedResponse = await redis.get(cacheKey)
//     if (cachedResponse) {
//       return NextResponse.json({ response: cachedResponse })
//     }

//     // Process with selected model
//     const modelHandler = MODELS[model].apiHandler
//     const response = await modelHandler(message)

//     // Save to Supabase
//     const { error: dbError } = await supabase
//       .from('messages')
//       .insert({
//         user_id: user.id,
//         message,
//         response,
//         model,
//         metadata: {
//           timestamp: new Date().toISOString(),
//           model_version: MODELS[model].version
//         }
//       })

//     if (dbError) {
//       throw dbError
//     }

//     // Cache response
//     await redis.set(cacheKey, response, { ex: 3600 }) // 1 hour expiry

//     // Data analysis tools
//     if (message.includes('analyze')) {
//       const analysis = await analyzeThroughPlotly(message)
//       return NextResponse.json({
//         response,
//         analysis,
//         visualizations: analysis.plots
//       })
//     }

//     return NextResponse.json({ response })

//   } catch (error) {
//     span.setStatus({
//       code: OpenTelemetry.SpanStatusCode.ERROR,
//       message: error.message
//     })
    
//     return NextResponse.json(
//       { error: 'Failed to process message' },
//       { status: 500 }
//     )
//   } finally {
//     span.end()
//   }
// }

// // Helper function for data analysis
// async function analyzeThroughPlotly(data: any) {
//   // Integrate with Plotly.jl for visualization
//   return {
//     summary: /* analysis summary */,
//     plots: /* plotly visualizations */
//   }
// }

// // Subscription handler for Beehiiv
// export async function PUT(request: Request) {
//   const { email } = await request.json()
  
//   try {
//     const response = await fetch('https://api.beehiiv.com/v2/subscribers', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${process.env.BEEHIIV_API_KEY}`
//       },
//       body: JSON.stringify({
//         email,
//         publication_id: process.env.BEEHIIV_PUBLICATION_ID
//       })
//     })

//     if (!response.ok) throw new Error('Subscription failed')

//     return NextResponse.json({ success: true })
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Failed to subscribe' },
//       { status: 500 }
//     )
//   }
// }
