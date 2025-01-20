'use client';

import { useEffect, useState } from 'react';
import { useSubscription } from '@apollo/client';
import { MenuDisplay } from '../components/MenuDisplay';
import { PromptForm } from '../components/PromptForm';
import { GENERATE_MENU_FROM_PROMPT_STREAM } from '../graphql/mutations';
import { Spinner } from '../components/Spinner';
import { StreamError } from '../../../server/src/__generated__/types'; //__generated__/types';

const emptyMenu = {
    courses: [],
    backgroundImage: ''
};

/**
 *
 */
export default function Home() {
    const [userInput, setUserInput] = useState('');
    const [shouldSubscribe, setShouldSubscribe] = useState(false);
    const [menu, setMenu] = useState(emptyMenu);
    const [subscriptionError, setSubscriptionError] = useState<StreamError | null>(null);
    let errorMessage = subscriptionError?.message;

    // eslint-disable-next-line prefer-const
    let { data, error, loading } = useSubscription(GENERATE_MENU_FROM_PROMPT_STREAM, {
        variables: { prompt: userInput },
        skip: !shouldSubscribe
    });

    if (error) {
        errorMessage = error.message;
    }

    useEffect(() => {
        if (!data?.generateMenuFromPrompt) return;
        const menuStream = data.generateMenuFromPrompt;

        if (menuStream.__typename === 'StreamError') {
            setSubscriptionError(menuStream);
            setMenu({ ...emptyMenu });
            setShouldSubscribe(false);
            return;
        }

        if (menuStream.courses && menuStream.courses.length > 0) {
            setMenu((prev) => ({
                ...prev,
                courses: menuStream.courses
            }));
        }

        if (menuStream.backgroundImage) {
            setMenu((prev) => ({
                ...prev,
                backgroundImage: menuStream.backgroundImage
            }));

            setShouldSubscribe(false);
        }
    }, [data]);

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setUserInput(event.target.value);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (userInput) {
            setMenu({ ...emptyMenu });
            setShouldSubscribe(true);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-800">
            <div className="p-4 text-white text-2xl font-bold">Munch</div>

            <div className="flex-1 flex flex-col justify-center items-center gap-8 p-24 pb-24 sm:p-4 overflow-y-auto">
                {loading ? (
                    <Spinner />
                ) : errorMessage ? (
                    <div className="text-red-500 text-lg">{errorMessage}</div>
                ) : (
                    menu && <MenuDisplay menu={menu} />
                )}
            </div>

            <PromptForm
                className="fixed bottom-0 z-50"
                userInput={userInput}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
