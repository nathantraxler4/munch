'use client';

import ChatWindow from '@/components/ChatWindow';
import { useMutation } from '@apollo/client';
import { useEffect, useState } from 'react';
import type { Message } from 'types';
import { PromptForm } from '../components/PromptForm';
import { Spinner } from '../components/Spinner';
import { PROMPT_AGENT } from '../graphql/mutations';

export default function Home() {
    const [userInput, setUserInput] = useState('');
    const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>();

    // eslint-disable-next-line prefer-const
    let [promptAgent, { data, error, loading }] = useMutation(PROMPT_AGENT, {
        variables: { prompt: userInput }
    });

    useEffect(() => {
        if (data) {
            setConversationMessages((prev) => [...prev, data.promptAgent]);
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            setErrorMessage(error.message);
        }
    }, [error]);

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setUserInput(event.target.value);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (userInput.trim().length > 0) {
            const userMessage: Message = {
                author: 'user',
                message: userInput,
            }
            setConversationMessages((prev) => [...prev, userMessage]);
            promptAgent({ variables: { prompt: userInput } });
            setUserInput("");
        }
    };

    function renderOrLoadingError() {
        if (loading) {
            return <Spinner />;
        }
        if (errorMessage) {
            return <div className="text-red-500 text-lg">{errorMessage}</div>;
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-800">
            <div className="p-4 text-white text-2xl font-bold">Munch</div>

            <div className="max-h-vh flex-1 flex flex-col justify-center items-center gap-8">
                <ChatWindow messages={conversationMessages} />
                {renderOrLoadingError()}
            </div>

            <PromptForm
                className="py-4"
                userInput={userInput}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
