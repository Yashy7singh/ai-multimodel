import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req) {
    const {model,msg,parentModel} = await req.json();

    try{
  
        /* Send POST request using Axios */
        const response = await axios.post(
          "https://kravixstudio.com/api/v1/chat",
          {
            message: msg, // Messages to AI
            aiModel: model,                     // Selected AI model
            outputType: "text"                         // 'text' or 'json'
          },
          {
            headers: {
              "Content-Type": "application/json",     // Tell server we're sending JSON
              "Authorization": "Bearer " + process.env.KRAVIXSTUDIO_API_KEY  // Replace with your API key
            }
          }
        );
        
        console.log(response.data); // Log API response
        return NextResponse.json({
          ...response.data,
          model:parentModel,
          modelId:model
        })
    } 


  // --- 🔴 ERROR HANDLING CATCHES THE FAILURE ---
  catch(error){
        
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.error || `External API failed with status ${statusCode}`;
        
        console.error(`Error from ${error.config.url}:`, errorMessage); // The exact error details!

        return NextResponse.json(
        { 
          success: false,
          model: parentModel,
          content: `❌ AI model failed to respond. Reason: ${errorMessage}`,
          error: errorMessage 
        },
        { status: statusCode }
      );
    }
}