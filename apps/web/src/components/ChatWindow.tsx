import { Menu, Recipe } from 'generated-graphql';

type Message = { message: string; menu: Menu; recipes: Recipe[] }; // TODO: consolidate this type with type defined in server.d

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
