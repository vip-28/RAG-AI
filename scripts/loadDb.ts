import { DataAPIClient } from "@datastax/astra-db-ts";
import {PuppeteerWebBaseLoader} from "langchain/document_loaders/web/puppeteer" //web scraper
import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";


import dotenv from "dotenv"
dotenv.config()

type SimilarityMetric= "dot_product" | "cosine" | "euclidean"
//to see the similarity between matrix those 3 are matrix types to find this
//cosine in default
//dotproduct is 50% faster than cosine but vectors needs to be normalized
//how close 2 vectors are then eucledian

const {OPEN_AI_API_KEY,
    ASTRA_DB_APPLICATION_TOKEN,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_NAMESPACE}= process.env


    //connect to openai server
    const openai= new OpenAI({
        apiKey:OPEN_AI_API_KEY
    })

    //GPT-4o mini will be used as its most economic 
const gptData=[
    'https://en.wikipedia.org/wiki/Formula_One',
    
]


const client=new  DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db= client.db(ASTRA_DB_API_ENDPOINT,{namespace:ASTRA_DB_NAMESPACE})

    
const splitter= new RecursiveCharacterTextSplitter({
    chunkSize:512,
    chunkOverlap:100
})// no. of characters in each chunks and overlapping characters in each context and thus just helps us in cross chunks questions


const createCollection = async(similarity:SimilarityMetric="dot_product")=>{
    const res=await db.createCollection(ASTRA_DB_COLLECTION,{
        vector:{
            dimension:1536, //   default openai embeddings size 
            metric: similarity
        }
    })
    console.log(res);
    
}


//functions to load data from website via chunks creation
const loadSampleData=async ()=>{
    const collection= await db.collection(ASTRA_DB_COLLECTION)
    for await(const url of gptData){
        const content = await scrapePage(url)
        const chunks=await splitter.splitText(content)
        for await(const chunk of chunks){
            const embedding=await openai.embeddings.create({
                model:"text-embedding-3-small",
                input:chunk,
                encoding_format:"float"
            })
            const vector= embedding?.data[0].embedding

            const res=await collection.insertOne({
                $vector:vector,
                text:chunk
            })
        }
    }
}


const scrapePage = async (url:string)=>{
const loader =new PuppeteerWebBaseLoader(url,{
    launchOptions:{
        headless:true
    },
    gotoOptions:{
        waitUntil:"domcontentloaded"
    },
    evaluate: async(page,browser)=>{
        const result = await page.evaluate(()=>document.body.innerHTML)
        await browser.close()
        return result
    }
})
return (await loader.scrape())?.replace(/<[^>]*>?/gm, '')
}


createCollection().then(()=>loadSampleData())