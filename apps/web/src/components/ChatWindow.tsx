import type { Message } from 'types';
import ChatBubble from './ChatBubble';
import { useEffect, useRef } from 'react';

type ChatWindowProps = { messages: Message[] };

export default function ChatWindow({ messages }: ChatWindowProps) {
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="max-w-5xl w-full flex flex-col gap-4 overflow-y-auto">
            {messages.map((message) => {
                return <ChatBubble key={message.message} message={message} />;
            })}
            <div ref={chatEndRef} />

        </div>
    );
}
