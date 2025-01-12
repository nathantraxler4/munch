"use client";

import TextareaAutosize from 'react-textarea-autosize';
import { FaArrowUp } from 'react-icons/fa';
import { useState } from "react";

export default function Home() {
  const [userInput, setUserInput] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('User input:', userInput);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-800">
      <div className="p-4">Munch</div>
      <div className="flex-1 flex flex-col justify-center items-center">
        <form
          onSubmit={handleSubmit}
          className="
            flex 
            items-center 
            gap-3 
            p-4 
            bg-slate-700 
            rounded-md 
            w-full 
            max-w-2xl
            focus-within:ring-2 
            focus-within:ring-green-600
          "
        >
          <TextareaAutosize
            id="user-text"
            name="user-text"
            value={userInput}
            onChange={handleInputChange}
            placeholder="Tell me what you're thinking..."
            minRows={1}       // start with 1 row
            maxRows={20}      // optional, limit to 10 rows
            className="
              flex-1
              resize-none
              p-2
              bg-slate-700
              border border-slate-700
              rounded-md
              focus:outline-none
            "
          />

          <button
            type="submit"
            className="
              bg-green-600
              hover:bg-green-700
              text-white
              font-medium
              px-3
              py-3
              focus:outline-none
              rounded-full
            "
          >
            <FaArrowUp className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
