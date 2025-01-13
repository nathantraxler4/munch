"use client";

import { useState } from "react";
import { useMutation } from '@apollo/client';
import { MenuDisplay } from '../components/MenuDisplay';
import { PromptForm } from '../components/PromptForm';
import { GENERATE_MENU_FROM_PROMPT } from '../graphql/mutations';
import { Spinner } from '../components/Spinner';

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [generateMenuFromPrompt, { data, loading, error }] = useMutation(GENERATE_MENU_FROM_PROMPT);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('User input:', userInput);

    generateMenuFromPrompt({ variables: { prompt: userInput } })
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-800">
      <div className="p-4 text-white text-2xl font-bold">Munch</div>
      
      <div className="flex-1 flex flex-col justify-center items-center gap-8 pb-24 overflow-y-auto">
        {loading ? (
          <Spinner />
        ) : error ? (
          // Render an error message if there is an error
          <div className="text-red-500 text-lg">
            Error: {error.message}
          </div>
        ) : (
          data?.generateMenuFromPrompt && <MenuDisplay menu={data.generateMenuFromPrompt} />
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
