import { Message } from 'types';

type ChatBubbleParams = { message: Message };

export default function ChatBubble({ message }: ChatBubbleParams) {
    return <div className={`bg-slate-700 p-8 rounded-xl`}>{message.message}</div>;
}
