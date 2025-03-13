import "./global.css"
export const metadata= {
    title: "gptDB",
    description:"Place for F1 question regarding Wiki page"
}

const RootLayout= ({children})=>{
return(
    <html>
        <body>{children}</body>
    </html>
)
}

export default RootLayout