import type { Message } from 'types';

type ChatWindowProps = { messages: Message[] };

export default function ChatWindow({ messages }: ChatWindowProps) {
    return (
        <div>
            {messages.map((message) => {
                return <div key={message.message}>{message.message}</div>;
            })}
        </div>
    );
}
