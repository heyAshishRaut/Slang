import Hover from "./Hover";
import img01 from "../assets/01.webp"
import img02 from "../assets/02.webp"
import img03 from "../assets/03.webp"
import img05 from "../assets/04.webp"
import img06 from "../assets/06.webp"
import copy from "../assets/copy.svg"
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function Showcase(){

    const navigate = useNavigate();

    // UI States
    const [enterMessage1, setEnterMessage1] = useState(false); // Rules and regulation CREATE state
    const [enterMessage2, setEnterMessage2] = useState(false); // Rules and regulation JOIN state
    const [create, setCreate] = useState(false); // Create button state
    const [join, setJoin] = useState(false); // Join button state
    const [roomReady, setRoomReady] = useState(false); // Room ready state

    // Form States
    const [roomTitle, setRoomTitle] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [roomID, setRoomID] = useState("");

    // Alert States
    const [isCreateOrNot, setIsCreateOrNot] = useState("");
    const [showAlert, setShowAlert] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    const socketRef = useRef<WebSocket | null>(null);

    // Alert function
    function Alert() {
        setShowAlert(true);
        setTimeout(() => {
            setShowAlert(false);
        }, 2000);
    }

    // RoomID generation function
    function generateRoomId() {
        const array = new Uint8Array(4);
        window.crypto.getRandomValues(array);
        const hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
        return hex.slice(0, 4) + '-' + hex.slice(4, 8);
    }

    // WebSocket connection function
    function connectWebSocket(): Promise<WebSocket> {
        return new Promise((resolve, reject) => {
            const socket = new WebSocket("ws://localhost:8080");

            socket.onopen = () => {
                console.log("Connected to WebSocket server");
                resolve(socket);
            };

            socket.onerror = (error) => {
                console.error("WebSocket connection error:", error);
                reject(error);
            };

            socket.onmessage = (event) => {
                handleServerMessage(event);
            };
        });
    }

    // Handle server messages
    function handleServerMessage(event: MessageEvent) {
        const message = JSON.parse(event.data);

        switch (message.type) {
            case "success":
                setIsCreateOrNot("Room Created Successfully!");
                Alert();

                // Store user room data
                sessionStorage.setItem("user-room", JSON.stringify({
                    roomid: roomID,
                    roomtitle: message.roomTitle,
                    fullname: fullName,
                    email: email,
                    isadmin: true
                }));

                // Clear form and navigate
                clearForm();
                setIsConnecting(false);
                navigate("/chat");
                break;

            case "join":
                setIsCreateOrNot("Joined Successfully!");
                Alert();

                // Store user room data
                sessionStorage.setItem("user-room", JSON.stringify({
                    roomid: roomID,
                    roomtitle: message.roomTitle,
                    fullname: fullName,
                    email: email,
                    isadmin: false
                }));

                // Clear form and navigate
                clearForm();
                setIsConnecting(false);
                navigate("/chat");
                break;

            case "limit":
                setIsCreateOrNot("Room limit reached. Please try later.");
                Alert();
                setIsConnecting(false);
                break;

            case "error":
                setIsCreateOrNot(message.message || "An error occurred");
                Alert();
                setIsConnecting(false);
                break;

            default:
                console.log("Unknown message type:", message);
        }
    }

    // Clear form function
    function clearForm() {
        setRoomTitle("");
        setFullName("");
        setEmail("");
        setRoomID("");
    }

    // Create room function
    async function CheckThenCreateRoom() {
        if (!roomTitle || !fullName || !email) {
            setIsCreateOrNot("All fields are mandatory.");
            Alert();
            return;
        }

        setIsConnecting(true);
        const generatedRoomId = generateRoomId();
        setRoomID(generatedRoomId);

        try {
            const socket = await connectWebSocket();
            socketRef.current = socket;

            const payload = {
                type: "create",
                payload: {
                    roomId: generatedRoomId,
                    roomTitle,
                    email,
                    fullName,
                    isAdmin: true
                }
            };

            socket.send(JSON.stringify(payload));
        } catch (error) {
            setIsCreateOrNot("Failed to connect to server");
            Alert();
            setIsConnecting(false);
        }
    }

    // Join room function
    async function JoinRoom() {
        if (!roomID || !fullName || !email) {
            setIsCreateOrNot("All fields are mandatory.");
            Alert();
            return;
        }

        setIsConnecting(true);

        try {
            const socket = await connectWebSocket();
            socketRef.current = socket;

            const payload = {
                type: "join",
                payload: {
                    roomId: roomID,
                    email,
                    fullName,
                    isAdmin: false
                }
            };

            socket.send(JSON.stringify(payload));
        } catch (error) {
            setIsCreateOrNot("Failed to connect to server");
            Alert();
            setIsConnecting(false);
        }
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);
    
    return (
        <div className="w-screen h-screen overflow-y-auto overflow-x-hidden text-[#FFF4A4] font-gambarino bg-black">
            
            {/* Alert Message */}
            <AnimatePresence>
                {showAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="absolute top-4 w-full flex justify-center z-50"
                    >
                        <div className="bg-black text-white border-2 border-yellow-300/60 px-8 py-3 text-xl">
                            {isCreateOrNot}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Rules (Create) */}
            <AnimatePresence>
                {enterMessage1 && (
                    <motion.div
                        style={{
                            background: `#03001e`,
                            backgroundImage: `linear-gradient(to right, #fdeff9, #ec38bc, #7303c0, #03001e)`,
                        }}
                        className="absolute w-full h-full flex items-center justify-center"
                        initial={{ opacity: 0, y: 0, scale: 1 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <div className="w-1/2 h-2/3 flex flex-col bg-black p-6 gap-x-6">
                            <div className="text-4xl font-extrabold text-white">Slang.</div>
                            <div className="w-full h-full flex flex-col pt-8">
                                <div className="text-2xl pb-6">Rules and Regulations</div>

                                <div className="w-full h-full bg-black grid grid-rows-3 gap-y-3 text-white">
                                    <div className="border border-[#FFF4A4] px-6 flex items-center justify-center">
                                        Each room can host up to 10 people. Additional users will be denied access once the limit is reached.
                                    </div>
                                    <div className="border border-[#FFF4A4] px-6 flex items-center justify-center">
                                        Respect all members. No hate speech, bullying, harassment, or discrimination of any kind. Keep the space friendly and welcoming.
                                    </div>
                                    <div className="border border-[#FFF4A4] px-6 flex items-center justify-center">
                                        If the room has a defined purpose (e.g., study, brainstorming), try to keep the conversation focused.
                                    </div>
                                </div>

                                <div className="pt-6 w-full flex justify-end gap-x-4">
                                    <button onClick={() => setEnterMessage1(false)} className="w-32 py-3 bg-white text-black">Cancel</button>
                                    <button onClick={() => setCreate(true)} className="w-32 py-3 bg-yellow-300/60 text-white">Understand</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Rules (Join) */}
            <AnimatePresence>
                {enterMessage2 && (
                    <motion.div
                        style={{
                            background: `#03001e`,
                            backgroundImage: `linear-gradient(to right, #fdeff9, #ec38bc, #7303c0, #03001e)`,
                        }}
                        className="absolute w-full h-full flex items-center justify-center"
                        initial={{ opacity: 0, y: 0, scale: 1 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <div className="w-1/2 h-2/3 flex flex-col bg-black p-6 gap-x-6">
                            <div className="text-4xl font-extrabold text-white">Slang.</div>
                            <div className="w-full h-full flex flex-col pt-8">
                                <div className="text-2xl pb-6">Rules and Regulations</div>

                                <div className="w-full h-full bg-black grid grid-rows-3 gap-y-3 text-white">
                                    <div className="border border-[#FFF4A4] px-6 flex items-center justify-center">
                                        Each room can host up to 10 people. Additional users will be denied access once the limit is reached.
                                    </div>
                                    <div className="border border-[#FFF4A4] px-6 flex items-center justify-center">
                                        Respect all members. No hate speech, bullying, harassment, or discrimination of any kind. Keep the space friendly and welcoming.
                                    </div>
                                    <div className="border border-[#FFF4A4] px-6 flex items-center justify-center">
                                        If the room has a defined purpose (e.g., study, brainstorming), try to keep the conversation focused.
                                    </div>
                                </div>

                                <div className="pt-6 w-full flex justify-end gap-x-4">
                                    <button onClick={() => setEnterMessage2(false)} className="w-32 py-3 bg-white text-black">Cancel</button>
                                    <button onClick={() => setJoin(true)} className="w-32 py-3 bg-yellow-300/60 text-white">Understand</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Room */}
            <AnimatePresence>
                {create && (
                    <motion.div
                        style={{
                            background: `#03001e`,
                            backgroundImage: `linear-gradient(to right, #fdeff9, #ec38bc, #7303c0, #03001e)`,
                        }}
                        className="absolute w-full h-full flex items-center justify-center"
                        initial={{ opacity: 0, y: 0, scale: 1 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <div className="w-1/2 h-2/3 flex bg-black p-6 gap-x-6">
                            <div className="w-2/3 h-full flex flex-col justify-center gap-y-4">
                                <div className="text-4xl flex gap-x-2 items-center pb-6">
                                    <svg className="size-10 rotate-[25deg]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                                    </svg>
                                    <div className="font-semibold">Create Room</div>
                                </div>

                                <input onChange={(e) => setFullName(e.target.value)} type="text" placeholder="Full Name" className="text-black pl-4 border-none outline-none py-3 font-fira" />
                                <input onChange={(e) => setEmail(e.target.value)} type="text" placeholder="Email" className="text-black pl-4 border-none outline-none py-3 font-fira" />
                                <input onChange={(e) => setRoomTitle(e.target.value)} type="text" placeholder="Room Title" className="text-black pl-4 border-none outline-none py-3 font-fira" />
                                
                                

                                <div className="self-end flex gap-x-4">
                                    <button onClick={() => setCreate(false)} className="bg-[#FFF4A4]/80 py-3 w-32 text-black bg-white">Cancel</button>
                                    <button onClick={() => {CheckThenCreateRoom()}} className="py-3 w-32 text-white bg-yellow-300/60">Create</button>
                                </div>
                            </div>
                            <div
                            style={{
                                backgroundImage: `url(${img05})`
                            }}
                            className="w-1/3 h-full flex items-center justify-center text-white text-4xl font-extrabold">
                                Slang.
                            </div>
                        </div>  
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Room Code */}
            <AnimatePresence>
                {roomReady && (
                    <motion.div
                        style={{
                            background: `#03001e`,
                            backgroundImage: `linear-gradient(to right, #fdeff9, #ec38bc, #7303c0, #03001e)`,
                        }}
                        className="absolute w-full h-full flex items-center justify-center"
                        initial={{ opacity: 0, y: 0, scale: 1 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <div className="w-1/2 h-2/3 flex flex-col bg-black p-6">
                            <div className="text-4xl font-extrabold text-white">Slang.</div>
                            <div className="pt-14 flex flex-col gap-y-6">
                                <div className="text-4xl text-center">Your Room is Ready!</div>
                                <div className="h-14 w-full px-14 flex items-center jusitfy-between gap-x-6">
                                    <div className="h-full w-[90%] border border-white flex items-center justify-center text-2xl font-fira">{roomID}</div>
                                    <img className="h-full w-[10%] border border-white p-3 hover:bg-yellow-300/30 hover:cursor-pointer" src={copy} alt="" />
                                </div>
                                <div className="text-white text-2xl text-center">Share the invite code above.</div>
                                <div className="self-center px-14 pt-14">
                               
                                    <button onClick={() => { navigate("/chat") }} className="py-3 w-32 text-white bg-yellow-300/60">Enter</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Join Room */}
            <AnimatePresence>
                {join && (
                    <motion.div
                        style={{
                            background: `#03001e`,
                            backgroundImage: `linear-gradient(to right, #fdeff9, #ec38bc, #7303c0, #03001e)`,
                        }}
                        className="absolute w-full h-full flex items-center justify-center"
                        initial={{ opacity: 0, y: 0, scale: 1 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <div className="w-1/2 h-2/3 flex bg-black p-6 gap-x-6">
                        
                            <div className="w-2/3 h-full flex flex-col justify-center gap-y-4">
                                <div className="text-4xl flex gap-x-2 items-center pb-6">
                                    <svg className="size-10 rotate-[25deg]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                                    </svg>
                                    <div className="font-semibold">Join Room</div>
                                </div>
                                
                                <input onChange={(e) => setFullName(e.target.value)} type="text" placeholder="Full Name" className="text-black pl-4 border-none outline-none py-3 font-fira" />
                                <input onChange={(e) => setEmail(e.target.value)} type="text" placeholder="Email" className="text-black pl-4 border-none outline-none py-3 font-fira" />
                                <input onChange={(e) => setRoomID(e.target.value)} type="text" placeholder="Room ID" className="text-black pl-4 border-none outline-none py-3 font-fira" />

                                <div className="self-end flex gap-x-4">
                                    <button onClick={() => { setJoin(false); }} className="py-3 w-32 text-black bg-white">Cancel</button>
                                    <button onClick={() => JoinRoom()} className="py-3 w-32 text-white bg-yellow-300/60">Join</button>
                                </div>
                            </div>

                            <div
                                style={{
                                    backgroundImage: `url(${img06})`
                                }}
                                className="w-1/3 h-full flex items-center justify-center text-white text-4xl font-extrabold bg-cover">
                                Slang.
                            </div>
                            
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* First section */}
            <div className="w-screen h-screen flex px-40 ">
                <div className="w-1/2 h-screen">
                    <div className="font-extrabold text-4xl pt-5 text-white">Slang.</div>
                    <div className=" flex flex-col gap-y-20 pb-14 pt-24">
                        <div className=" text-4xl">Speak Freely, Instantly, Anywhere.</div>
                        <div className="text-2xl">Anyone can spin up a room in a second or join with a shareable invite - great for quick team syncs or casual hangouts.</div>
                        <div className="flex gap-x-4">
                            <button onClick={() => setEnterMessage1(true)} className="text-black py-3 w-32 bg-white">Create</button>
                            <button onClick={() => setEnterMessage2(true)} className="py-3 w-32 text-white bg-yellow-300/60">Join</button>
                        </div>
                    </div>

                    <div className="w-full pr-14">
                        <div className="h-4 w-full bg-[#FFF4A4]"></div>
                        <div className="h-4 w-full bg-[#FFF4A4] mt-4"></div>
                    </div>
                </div>

                <div className="w-1/2 h-screen py-5">
                    <Hover/>
                </div>  
            </div>

            {/* Second section */}
            <div className="w-screen h-screen">
                <div className="w-full h-full">
                    <div className="w-full h-[20%] flex items-center justify-center text-3xl">
                        Jump into rooms with just a name and code - no signup required.
                    </div>
                    <div className="h-[80%] w-full px-40 pb-4">
                        <div className="h-full w-full border-4 border-yellow-300/80"></div>
                    </div>
                </div>
                
            </div>

            {/* Third section */}
            <div className="w-screen h-screen px-40 py-10">
                <div className="text-4xl h-[15%]">Things you can do -</div>
                <div className="w-full h-[85%] grid grid-rows-1 grid-cols-3 gap-8">
                    <div style={{ backgroundImage: `url(${img01})` }} className="bg-center w-full h-full border-4 border-yellow-300/80 flex items-start p-6 text-3xl">
                        <div>Study together, <br /> even if you're miles apart.</div>
                    </div>
                    <div style={{ backgroundImage: `url(${img02})` }} className="bg-center w-full h-full border-4 border-yellow-300/80 flex items-center p-6 text-3xl">
                        <div>Map out memories together, <br /> before you even pack.</div>
                    </div>
                    <div style={{ backgroundImage: `url(${img03})` }} className=" bg-center w-full h-full border-4 border-yellow-300/80 flex items-end p-6 text-3xl">
                        <div>Stream the screen, <br /> Scream in the chat.</div>
                    </div>
                </div>
            </div>

            {/* Fourth section */}
            <div className="h-64 w-full flex flex-col gap-y-6 items-center justify-center">
                <div className="text-2xl">Created by <span className="text-white">Ashish Raut</span></div>
                <div className="flex gap-x-6 items-center">
                    <a href="" target="_blank"><svg className="h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path fill="#fff4a4" d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3 .7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3 .3 2.9 2.3 3.9 1.6 1 3.6 .7 4.3-.7 .7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3 .7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3 .7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z" /></svg></a>
                    <a href="" target="_blank"><svg className="h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#fff4a4" d="M100.3 448H7.4V148.9h92.9zM53.8 108.1C24.1 108.1 0 83.5 0 53.8a53.8 53.8 0 0 1 107.6 0c0 29.7-24.1 54.3-53.8 54.3zM447.9 448h-92.7V302.4c0-34.7-.7-79.2-48.3-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.8V148.9h89.1v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3V448z" /></svg></a>
                    <a href="" target="_blank"><svg className="h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#fff4a4" d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" /></svg></a>   
                </div>
            </div>
        </div>
    );
}

export default Showcase;