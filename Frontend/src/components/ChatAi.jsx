import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { Send } from 'lucide-react';

function ChatAi({ problem }) {
    const [messages, setMessages] = useState([
        { role: 'model', parts: [{ text: "Hello! I am your AI DSA tutor. Ask me for hints, edge cases, time complexity analysis, or approach recommendations for this problem." }] }
    ]);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const onSubmit = async (data) => {
        if (!data.message?.trim() || loading) return;

        const userMsg = { role: 'user', parts: [{ text: data.message.trim() }] };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        reset();
        setLoading(true);

        try {
            const response = await axiosClient.post("/ai/chat", {
                messages: updatedMessages,
                title: problem?.title,
                description: problem?.description,
                testCases: problem?.visibleTestCases,
                startCode: problem?.startCode
            });

            setMessages(prev => [...prev, { 
                role: 'model', 
                parts: [{ text: response.data.message }] 
            }]);
        } catch (error) {
            console.error("AI Chat API Error:", error);
            const errorMsg = error.response?.data?.message || error.message || "Error from AI Chatbot";
            setMessages(prev => [...prev, { 
                role: 'model', 
                parts: [{ text: `⚠️ ${errorMsg}` }]
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[75vh] min-h-[480px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}
                    >
                        <div className={`chat-bubble whitespace-pre-wrap text-sm ${msg.role === "user" ? "chat-bubble-primary" : "bg-base-200 text-base-content"}`}>
                            {msg.parts[0].text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="chat chat-start">
                        <div className="chat-bubble bg-base-200 text-base-content flex items-center gap-2">
                            <span className="loading loading-dots loading-sm"></span>
                            <span className="text-xs opacity-70">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form 
                onSubmit={handleSubmit(onSubmit)} 
                className="sticky bottom-0 p-3 bg-base-100 border-t border-base-300"
            >
                <div className="flex items-center gap-2">
                    <input 
                        placeholder="Ask for a hint, complexity analysis, or approach..." 
                        className="input input-bordered input-sm flex-1" 
                        disabled={loading}
                        {...register("message", { required: true, minLength: 1 })}
                    />
                    <button 
                        type="submit" 
                        className={`btn btn-primary btn-sm ${loading ? 'loading' : ''}`}
                        disabled={loading || errors.message}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ChatAi;