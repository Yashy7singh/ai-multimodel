import arcjet, { tokenBucket } from "@arcjet/next";

export const aj  = arcjet({
    key : process.env.ARCJET_KEY,
    rules:
        tokenBucket({
            mode:"LIVE",
            characteristics: ["userId"],
            refillRate:5,
            interval : 8640,
            capacity:5
        })
})