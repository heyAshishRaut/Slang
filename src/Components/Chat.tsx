import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom";

export default function Chat() {
    const navigate = useNavigate();
    const [leave, setLeave] = useState(false);
    type ChatMessage = {
        email: string;
        message: string;
        timestamp?: number;
    };

    type Participant = {
        email: string;
        fullName: string;
        isAdmin: boolean;
    };

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [input, setInput] = useState("");
    // @ts-ignore
    const [isConnected, setIsConnected] = useState(false);
    // @ts-ignore
    const [isReconnecting, setIsReconnecting] = useState(false);

    const socketRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const reconnectTimeoutRef = useRef<any>(null);

    const userRoom = JSON.parse(sessionStorage.getItem("user-room") || "{}");
    const { roomid, roomtitle, email, fullname, isadmin } = userRoom;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const connectWebSocket = () => {
        if (!roomid || !email) {
            navigate("/");
            return;
        }

        setIsReconnecting(true);
        const socket = new WebSocket("ws://localhost:8080");
        socketRef.current = socket;

        socket.onopen = () => {
            console.log("WebSocket connection established");
            setIsConnected(true);
            setIsReconnecting(false);

            // Send join message to get existing messages and participants
            const joinMessage = {
                type: "join",
                payload: {
                    roomId: roomid,
                    email,
                    fullName: fullname,
                    isAdmin: isadmin
                }
            };

            socket.send(JSON.stringify(joinMessage));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case "join":
                    // Set participants from server response
                    if (data.participants) {
                        setParticipants(data.participants);
                    }
                    break;

                case "chat":
                    setMessages((prev) => {
                        // Prevent duplicate messages
                        const exists = prev.some(msg =>
                            msg.email === data.payload.email &&
                            msg.message === data.payload.message &&
                            msg.timestamp === data.payload.timestamp
                        );
                        if (!exists) {
                            return [...prev, data.payload];
                        }
                        return prev;
                    });
                    break;

                case "user_joined":
                    setParticipants((prev) => {
                        // Check if user already exists
                        const exists = prev.some(p => p.email === data.payload.email);
                        if (!exists) {
                            return [...prev, {
                                email: data.payload.email,
                                fullName: data.payload.fullName,
                                isAdmin: data.payload.isAdmin || false
                            }];
                        }
                        return prev;
                    });

                    // Add system message
                    setMessages((prev) => [...prev, {
                        email: "system",
                        message: `${data.payload.fullName} joined the room`,
                        timestamp: Date.now()
                    }]);
                    break;

                case "user_left":
                    setParticipants((prev) => prev.filter(p => p.email !== data.payload.email));

                    // Add system message
                    setMessages((prev) => [...prev, {
                        email: "system",
                        message: `${data.payload.fullName} left the room`,
                        timestamp: Date.now()
                    }]);
                    break;

                case "error":
                    console.error("WebSocket error:", data.message);
                    // Handle specific errors
                    if (data.message === "Room not found") {
                        alert("Room not found. Redirecting to home.");
                        navigate("/");
                    }
                    break;

                default:
                    console.log("Unknown message type:", data);
            }
        };

        socket.onclose = () => {
            console.log("WebSocket connection closed");
            setIsConnected(false);

            // Attempt to reconnect after 3 seconds
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }

            reconnectTimeoutRef.current = setTimeout(() => {
                console.log("Attempting to reconnect...");
                connectWebSocket();
            }, 3000);
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            setIsConnected(false);
        };
    };

    useEffect(() => {
        connectWebSocket();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    const sendMessage = () => {
        if (!input.trim()) return;

        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.error("WebSocket not connected");
            return;
        }

        const messageData = {
            type: "chat",
            payload: {
                roomId: roomid,
                email,
                message: input.trim(),
            },
        };

        socket.send(JSON.stringify(messageData));
        setInput("");
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const leaveRoom = () => {
        if (socketRef.current) {
            socketRef.current.close();
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        sessionStorage.removeItem("user-room");
        navigate("/");
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    // @ts-ignore
    const formatTime = (timestamp?: number) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Redirect if no room data
    if (!roomid || !email) {
        navigate("/");
        return null;
    }

    return (
        <div
            style={{
                background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(251, 191, 36, 0.25), transparent 70%), #000000",
            }}
            className="bg-[#1a1a1a] w-screen h-screen font-fira">

            {/* Navbar */}
            <div className="h-[9%] w-screen flex items-center justify-between px-[120px]">
                <div className="font-extrabold text-4xl text-white font-gambarino">Slang.</div>

                <div className="h-full py-2 flex gap-x-2">
                    <div className="select-none px-8 h-full border border-gray-500/50 rounded-lg flex items-center justify-center font-fira text-white">
                        {roomtitle}
                    </div>
                    <div onClick={() => { setLeave(!leave) }} className="cursor-pointer h-full w-14 border border-gray-500/50 rounded-lg flex items-center justify-center hover:bg-gray-500/20 hover:border-0">
                        {
                            !leave ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-7 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-7 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            )
                        }
                    </div>
                    {
                        leave && (
                            <div className="absolute top-[9%] right-[120px] w-[220px] backdrop-blur-xl text-white border border-gray-500/50 rounded-lg">
                                <div className="select-none h-[55px] border-b border-gray-500/50 w-full flex items-center justify-center text-lg">
                                    {roomid}
                                </div>
                                <div className="h-[55px] w-full flex gap-x-2 p-2">
                                    <div className="h-full w-1/5 hover:bg-gray-400/30 bg-white/10 rounded-full cursor-pointer flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                        </svg>
                                    </div>
                                    <div
                                        onClick={leaveRoom}
                                        className="cursor-pointer h-full w-4/5 bg-red-500/40 hover:bg-red-500/50 rounded-lg flex items-center justify-center"
                                    >
                                        Leave
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>

            {/* Body */}
            <div className="w-screen h-[91%] flex justify-center pt-2 pb-4 gap-x-4 px-[120px]">

                {/* Participants Panel */}
                <div className="w-[25%] h-full border border-gray-500/50 rounded-lg overflow-hidden py-2">
                    <div className="text-lg h-[6%] text-neutral-400 flex items-center px-6 justify-between">
                        <div>Participants</div>
                        <div>{participants.length}/10</div>
                    </div>
                    <div
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        className="h-[94%] w-full px-2 flex flex-col gap-y-2 pt-2 overflow-scroll"
                    >
                        {/* @ts-ignore */}
                        {participants.map((participant, index) => (
                            <div key={participant.email} className="min-h-[55px] select-none hover:bg-gray-400/20 bg-white/10 w-full rounded-lg flex gap-x-4 items-center px-2">
                                <div className="h-[80%] w-[16%] border border-white/30 flex items-center justify-center text-2xl font-gambarino rounded-full text-white">
                                    {getInitials(participant.fullName)}
                                </div>
                                <div className="h-full w-[80%] flex flex-col justify-center text-sm">
                                    <div className="text-white/80 flex gap-x-2 items-center">
                                        <div>{participant.fullName}</div>
                                        {participant.isAdmin && (
                                            <div className="text-[10px] px-4 bg-red-700/30 text-white/60 rounded-[25px]">admin</div>
                                        )}
                                    </div>
                                    <div className="text-white/50 text-[12px]">{participant.email}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Panel */}
                <div className="w-[50%] h-full flex flex-col border border-gray-500/50 rounded-lg">
                    {/* Messages section */}
                    <div className="w-full h-[92%] overflow-y-auto p-4 space-y-3">
                        {messages.map((message, index) => (
                            <div key={index} className={`flex ${message.email === email ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-3 rounded-lg ${message.email === 'system'
                                        ? 'bg-gray-600/50 text-gray-300 text-center text-sm'
                                        : message.email === email
                                            ? 'bg-blue-600/50 text-white'
                                            : 'bg-gray-700/50 text-white'
                                    }`}>
                                    {message.email !== 'system' && message.email !== email && (
                                        <div className="text-xs text-gray-400 mb-1">{message.email}</div>
                                    )}
                                    <div>{message.message}</div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input section */}
                    <div className="w-full h-[8%] border-t border-gray-500/50 p-[5px] text-sm flex items-center justify-between pl-5">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="relative h-full w-[90%] px-6 text-white/60 outline-none rounded-[25px] bg-gray-500/20"
                            placeholder="Type something . . ."
                        />
                        <div
                            onClick={sendMessage}
                            className="w-[10%] flex items-center justify-center cursor-pointer hover:bg-gray-500/20 rounded-full p-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
                                <path fill="#ffffff" opacity={0.7} fillRule="evenodd" d="M2.345 2.245a1 1 0 0 1 1.102-.14l18 9a1 1 0 0 1 0 1.79l-18 9a1 1 0 0 1-1.396-1.211L4.613 13H10a1 1 0 1 0 0-2H4.613L2.05 3.316a1 1 0 0 1 .294-1.071z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}