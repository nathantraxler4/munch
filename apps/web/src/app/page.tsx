'use client';

import { useEffect, useState } from 'react';
import { useSubscription } from '@apollo/client';
import { MenuDisplay } from '../components/MenuDisplay';
import { PromptForm } from '../components/PromptForm';
import { GENERATE_MENU_FROM_PROMPT_STREAM } from '../graphql/mutations';
import { Spinner } from '../components/Spinner';

const emptyMenu = {
    courses: [],
    backgroundImage: ''
}

/**
 *
 */
export default function Home() {
    const [userInput, setUserInput] = useState('');
    const [shouldSubscribe, setShouldSubscribe] = useState(false);
    const [menu, setMenu] = useState(emptyMenu)

    const { data, error, loading } = useSubscription(
            GENERATE_MENU_FROM_PROMPT_STREAM,
            { 
                variables: { prompt: userInput },
                skip: !shouldSubscribe
            }
          );

  useEffect(() => {
    if (!data?.generateMenuFromPrompt) return;
    const partialMenu = data.generateMenuFromPrompt

    if (partialMenu.courses && partialMenu.courses.length > 0) {
      setMenu(prev => ({
        ...prev,
        courses: partialMenu.courses,
      }));
    }

    if (partialMenu.backgroundImage) {
      setMenu(prev => ({
        ...prev,
        backgroundImage: partialMenu.backgroundImage,
      }));
      
      setShouldSubscribe(false);
    }
    
    // TODO
    // if (data.generateMenuFromPrompt.error) { ... }
  }, [data]);

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setUserInput(event.target.value);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (userInput) {
            setMenu( {...emptyMenu })
            setShouldSubscribe(true)
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-800">
            <div className="p-4 text-white text-2xl font-bold">Munch</div>

            <div className="flex-1 flex flex-col justify-center items-center gap-8 p-24 pb-24 sm:p-4 overflow-y-auto">
                {loading ? (
                    <Spinner />
                ) : error ? (
                    <div className="text-red-500 text-lg">{error.message}</div>
                ) : (
                    menu && (
                        <MenuDisplay menu={menu} />
                    )
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
