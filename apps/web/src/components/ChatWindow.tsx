import type { Message } from 'types';
import ChatBubble from './ChatBubble';

type ChatWindowProps = { messages: Message[] };

export default function ChatWindow({ messages }: ChatWindowProps) {
    return (
        <div className="max-w-5xl w-full flex flex-col gap-4">
            {messages.map((message) => {
                return <ChatBubble key={message.message} message={message} />;
            })}
        </div>
    );
}
