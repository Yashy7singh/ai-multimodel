import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { aj } from "@/config/Arcjet";

export async function POST(req) {
    const user = await currentUser();
    const {token} =  await req.json();

    if(token){
        const decision = await aj.protect(req,
         {userId:user?.primaryEmailAddress?.emailAddress, 
            requested : token});

        if(decision.isDenied()){
            return NextResponse.json({
                error:'Too many Request',
                remainingToken:decision.reason.remaining
            })
        }
        return NextResponse.json({allowed:true,remainingToken:decision.reason.remaining})
    }

    else{
        const decision = await aj.protect(req,
            {userId:user?.primaryEmailAddress?.emailAddress, 
                requested : 0});
        console.log("Arcjet decision",decision.reason.remaining);

        const remainingToken = decision.reason.remaining;

        return NextResponse.json({remainingToken:remainingToken})
         }
    
}