import { Button } from '@/components/ui/button'
import { Mic, Paperclip, Send } from 'lucide-react'
import React, { useContext, useEffect, useState } from 'react'
import AiMultiModels from './AiMultiModels'
import { AiSelectedModelContext } from '@/context/AiSelectedModelContext';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid'; 
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/FirebaseConfig';
import { useAuth, useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner';

function ChatInputBox() {
    const [userInput, setUserInput] = useState('');
    const {aiSelectedModels, setAiSelectedModels,messages,setMessages} = useContext(AiSelectedModelContext);

    const [chatId,setChatId] = useState();
    const {user} = useUser();
    const params = useSearchParams();
    const hasUnlimitedPlan = user?.publicMetadata?.plan === 'unlimited_plan';
    // const paidUser = has({plan:'unlimited_plan'});

    useEffect(()=>{
        const chatId_ = params.get('chatId');
        if(chatId_){
            setChatId(chatId_);
            GetMessages(chatId_);
        }
        else{
            setMessages([])
            setChatId(uuidv4())
        }    
    },[params])

    const handleSend = async () => {
        if (!userInput.trim()) return;

        // deduct and check token limit
        if(!hasUnlimitedPlan){
                const result = await axios.post('/api/user-remaining-msg',{
                    token:1
                });
                const remainingToken = result?.data?.remainingToken;

                if(remainingToken<=0){
                    console.log("Limit Exceed");
                    toast.error('Maximum Daily Limit Exceed')
                    return;
                }
        }

        // 1️⃣ Add user message to all enabled models
        setMessages((prev) => {
            const updated = { ...prev };
            Object.keys(aiSelectedModels).forEach((modelKey) => {
                if(aiSelectedModels[modelKey].enable){
                updated[modelKey] = [
                ...(updated[modelKey] ?? []),
                {
                    role: "user",
                    content: userInput,
                    model: modelKey,
                    modelId: aiSelectedModels[modelKey]?.modelId || "unknown",
                },
                ];
            } 
            });
            return updated;
        });

        const currentInput = userInput; // capture before reset
        setUserInput("");

        // 2️⃣ Fetch response from each enabled model
        Object.entries(aiSelectedModels).forEach(async ([parentModel, modelInfo]) => {
            if (!modelInfo.modelId || aiSelectedModels[parentModel].enable==false) return;

            // Add loading placeholder before API call
            setMessages((prev) => ({
                ...prev,
                [parentModel]: [
                    ...(prev[parentModel] ?? []),
                    { role: "assistant", content: "loading...", model: parentModel, loading: true },
                ],
            }));


            try {
                const result = await axios.post("/api/ai-multi-model", {
                    model: modelInfo.modelId,
                    msg: [{ role: "user", content: currentInput }],
                    parentModel,
                });

                const { aiResponse, model } = result.data;

                // 3️⃣ Add AI response to that model’s messages
                setMessages((prev) => {
                    const updated = [...(prev[parentModel] ?? [])];
                    const loadingIndex = updated.findIndex((m) => m.loading);

                    if (loadingIndex !== -1) {
                       updated[loadingIndex] = {
                        role: "assistant",
                        content: aiResponse,
                        model: parentModel, // e.g. "Mistral"
                        modelId: modelInfo.modelId, // e.g. "mistral-medium-2505"
                        loading: false,
                        };
                    } else {
                        // fallback if no loading msg found
                        updated.push({
                        role: "assistant",
                        content: aiResponse,
                        model: parentModel,
                        modelId: modelInfo.modelId,
                        loading: false,
                        });
                    }

                    return { ...prev, [parentModel]: updated };
                });
            } catch (err) {
                console.error(err);
                setMessages((prev) => ({
                    ...prev,
                    [parentModel]: [
                        ...(prev[parentModel] ?? []),
                        { role: "assistant", content: "⚠️ Error fetching response." },
                    ],
                }));
            }
        });
    };

    useEffect(()=>{
        if(messages){
            SaveMessages();
        }
    },[messages])

    const SaveMessages = async() =>{    
        const docRef = doc(db,'chatHistory',chatId);

        await setDoc(docRef,{
            chatId:chatId,
            userEmail: user?.primaryEmailAddress?.emailAddress,
            messages:messages,
            lastUpdated: Date.now()
        })
    }

    const GetMessages = async()=>{
        const docRef = doc(db,'chatHistory',chatId);
        const docSnap = await getDoc(docRef);
        console.log(docSnap.data());
        const docData = docSnap.data();
        setMessages(docData.messages);
    }

  return (
    <div className='relative min-h-screen'>
        {/* page content */}
        <div>
            <AiMultiModels/>
        </div>

        {/* fixed chat input */}
        <div  className='fixed bottom-0 left-0 w-full flex justify-center px-4 pb-4'>
            <div className='w-full border rounded-xl shadow-md max-w-2xl p-4'>
                <input type="text" 
                placeholder='Ask me anything...' 
                className='border-0 outline-none w-full'
                value={userInput}
                onChange={(event)=>setUserInput(event.target.value)}
                />

                <div className='mt-3 flex justify-between items-center'>
                    <Button variant={'Ghost'} size={'icon'}>
                        <Paperclip className='h-5 w-5'/>
                    </Button>

                    <div className='flex gap-5'>
                        <Button variant={'Ghost'} size={'icon'}><Mic/></Button>
                        <Button  size={'icon'} className={'bg-gray-500'} onClick={handleSend}><Send/></Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default ChatInputBox;
