import OpenAI from "openai";
import {StreamingTextResponse} from "ai"

import { OpenAIStream } from "ai";


import { DataAPIClient } from "@datastax/astra-db-ts";
import dotenv from "dotenv"
dotenv.config()
const {OPEN_AI_API_KEY,
    ASTRA_DB_APPLICATION_TOKEN,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_NAMESPACE}= process.env


const openai=new OpenAI({
    apiKey:OPEN_AI_API_KEY
})
const client= new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db= client.db(ASTRA_DB_API_ENDPOINT,{namespace: ASTRA_DB_NAMESPACE})

export async function POST(req:Request, res:Response){
try{
const {messages}= await req.json()
const latestMessages= messages[messages?.length-1]?.content

let docContent=""


const embedding= await openai.embeddings.create({
    model:"text-embedding-3-small",
    input:latestMessages,
    encoding_format:"float"
})

try{
    const collection= await db.collection(ASTRA_DB_COLLECTION)
    const cursor = await collection.find(null,{
        sort:{
            $vector:embedding.data[0].embedding,

        },
        limit:10
    })
    const docs= await cursor.toArray();
    const docsMap= docs.map((e)=>e.text)
const docsContext=JSON.stringify(docsMap)
console.log("hello");

const template= {
    role:"system",
    content:`
     You are an AI Assistant who knows everything about Formula One. Use the Below context to augment what you know about Formula One
      racing. The context will provide you with the most recent pages data from wikimedia.
      If the context doesn't include the information you need, answer based on your existing knowledge. Don't mention the source of your
      information or what the context does or doesn't include.

      Format responses using markdown where applicable and don't return images.
      Strictly Stay on the topic of Formula one , if User tries to deviate from the coversation remind them or urge them to ask questions
      related to Formula one and Do not give them answer too if the question is not related to formula one

      ---------------------------
      START CONTEXT
      ${docsContext}
      END CONTEXT

      -----------------
      Question: ${latestMessages}
      -----------------

    `
    
}


const response = await openai.chat.completions.create({
    model:"gpt-4o-mini",
   stream:true,
    messages:[template,...messages],
    
})

const stream= OpenAIStream(response)
return new StreamingTextResponse(stream)

}catch(err){
    console.log("error " +err);
    const docsContext=""
    
}





}catch(err){
    console.log("Error Querying DB "+ err);
    
}
}




// ----------------------------------------------------------------------
// import OpenAI from "openai";
// import { StreamingTextResponse } from "ai";
// import { DataAPIClient } from "@datastax/astra-db-ts";
// import dotenv from "dotenv";

// dotenv.config();

// const {
//   OPEN_AI_API_KEY,
//   ASTRA_DB_APPLICATION_TOKEN,
//   ASTRA_DB_API_ENDPOINT,
//   ASTRA_DB_COLLECTION,
//   ASTRA_DB_NAMESPACE
// } = process.env;

// const openai = new OpenAI({
//   apiKey: OPEN_AI_API_KEY
// });

// const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
// const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

// // Create a manual stream conversion function
// function createReadableStream(asyncIterable) {
//   return new ReadableStream({
//     async start(controller) {
//       try {
//         for await (const chunk of asyncIterable) {
//           const content = chunk.choices[0]?.delta?.content || '';
//           if (content) {
//             controller.enqueue(new TextEncoder().encode(content));
//           }
//         }
//         controller.close();
//       } catch (error) {
//         controller.error(error);
//       }
//     }
//   });
// }

// export async function POST(req: Request) {
//   try {
//     const { messages } = await req.json();
//     const latestMessage = messages[messages?.length - 1]?.content;

//     let docsContext = "";

//     const embedding = await openai.embeddings.create({
//       model: "text-embedding-3-small",
//       input: latestMessage,
//       encoding_format: "float"
//     });

//     try {
//       const collection = await db.collection(ASTRA_DB_COLLECTION);
//       const cursor = await collection.find(null, {
//         sort: {
//           $vector: embedding.data[0].embedding,
//         },
//         limit: 10
//       });

//       const docs = await cursor.toArray();
//       const docsMap = docs.map((e) => e.text);
//       docsContext = JSON.stringify(docsMap);
//     } catch (err) {
//       console.log("Error retrieving documents: " + err);
//       docsContext = "[]";
//     }

//     const template = {
//       role: "system",
//       content: `
//       You are an AI Assistant who knows everything about Formula One. Use the Below context to augment what you know about Formula One
//       racing. The context will provide you with the most recent pages data from wikimedia.
//       If the context doesn't include the information you need, answer based on your existing knowledge. Don't mention the source of your
//       information or what the context does or doesn't include.

//       Format responses using markdown where applicable and don't return images.
//       Strictly Stay on the topic of Formula one , if User tries to deviate from the coversation remind them or urge them to ask questions
//       related to Formula one and Do not give them answer too if the question is not related to formula one

//       ---------------------------
//       START CONTEXT
//       ${docsContext}
//       END CONTEXT

//       -----------------
//       Question: ${latestMessage}
//       -----------------
//       `
//     };

//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       stream: true,
//       messages: [template, ...messages],
//     });

//     // Create a readable stream from the OpenAI response
//     const readableStream = createReadableStream(response);

//     // Return a streaming text response with the readable stream
//     return new StreamingTextResponse(readableStream);
//   } catch (err) {
//     console.log("Error processing request: " + err);
//     return new Response(JSON.stringify({ error: "An error occurred", details: err.message }), {
//       status: 500,
//       headers: {
//         "Content-Type": "application/json"
//       }
//     });
//   }
// }