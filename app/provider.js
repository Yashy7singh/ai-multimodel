"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/AppSidebar";
import AppHeader from "./_components/AppHeader";
import { useUser } from "@clerk/nextjs";
import { doc, getDoc, setDoc,updateDoc } from "firebase/firestore";
import { db } from '@/config/FirebaseConfig'
import { AiSelectedModelContext } from "@/context/AiSelectedModelContext";
import { DefaultModel } from "@/shared/AiModelsShared";
import { UserDetailContext } from "@/context/UserDetailContext";
/**
 * @typedef {import("next-themes/dist/types").ThemeProviderProps} ThemeProviderProps
 * @extends {React.PropsWithChildren<ThemeProviderProps>}
 */

/**
 * A wrapper component that provides theme context (light/dark mode) to the application.
 * It uses the 'next-themes' library.
 * * @param {ThemeProviderProps} props - Props passed to the next-themes provider.
 * @returns {JSX.Element}
 */
function ThemeProvider({ children, ...props }) {
  const {user} = useUser();
  const [aiSelectedModels, setAiSelectedModels] = React.useState(DefaultModel);
  const [userDetail, setUserDetail]= React.useState();
  const [messages,setMessages] = React.useState({});
  React.useEffect(()=>{
    if(user){
      CreateNewuser();
    }
  },[user])

  React.useEffect(()=>{
    if(aiSelectedModels){
      updateAiModelSelectionPref();
    }
  },[aiSelectedModels]);

  const updateAiModelSelectionPref = async()=>{
    const docRef = doc(db,"users",user?.primaryEmailAddress?.emailAddress);
            await updateDoc(docRef,{
                selectedModelPref: aiSelectedModels
            })
  }


  const CreateNewuser = async() =>{
    const userRef = doc(db,"users",user?.primaryEmailAddress?.emailAddress);
    const userSnap = await getDoc(userRef);

    if(userSnap.exists()){
      console.log("Existing user");
      const userInfo = userSnap.data();
      setAiSelectedModels(userInfo?.selectedModelPref??DefaultModel);
      setUserDetail(userInfo);
      return;
    }
    else{
      const userData = {
        name : user?.fullName,
        email : user?.primaryEmailAddress.emailAddress,
        createdAt : new Date(),
        remainingMsg : 5,
        plan : 'Free',
        credits : 1000
      }
      await setDoc(userRef,userData);
      console.log("New user data saved");
      setUserDetail(userData);
    }
  }
  
  return <NextThemesProvider {...props}
      attribute = "class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
  >
    <UserDetailContext.Provider value={{userDetail, setUserDetail}}>
        <AiSelectedModelContext.Provider value={{aiSelectedModels, setAiSelectedModels,messages,setMessages}}>
            <SidebarProvider>
              <AppSidebar/>
              
              <div className="w-full">
                <AppHeader/>
                {children}</div>
            </SidebarProvider>
        </AiSelectedModelContext.Provider>
    </UserDetailContext.Provider>
    
    </NextThemesProvider>;
}

export default ThemeProvider;
