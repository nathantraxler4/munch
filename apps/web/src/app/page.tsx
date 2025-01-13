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

  if (loading) return (
    <Spinner/>
  )

  return (
    <div className="flex flex-col h-screen bg-slate-800">
      <div className="p-4 text-white text-2xl font-bold">Munch</div>
      
      <div className="flex-1 flex flex-col justify-end items-center gap-8 pb-16 overflow-y-auto">
        {data?.generateMenuFromPrompt && (
          <MenuDisplay menu={data.generateMenuFromPrompt} />
        )}

        <PromptForm
          className="sticky bottom-2"
          userInput={userInput}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
