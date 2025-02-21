import { Message } from 'types';

type ChatBubbleParams = { message: Message };

export default function ChatBubble({ message }: ChatBubbleParams) {
    const isUser = message.author === 'user';
    const userBubbleStyle = 'bg-green-600 self-end'
    const aiBubbleStyle = 'bg-slate-600 self-start'
    const bubbleStyle = isUser ? userBubbleStyle : aiBubbleStyle;

    return (
        <div className={`p-8 rounded-xl max-w-[80%] text-white ${bubbleStyle}`}>
            {message.message}
        </div>
    );
}