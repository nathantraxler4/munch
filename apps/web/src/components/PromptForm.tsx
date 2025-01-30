import { FaArrowUp } from 'react-icons/fa';
import TextareaAutosize from 'react-textarea-autosize';

interface PromptFormProps {
    className: string;
    userInput: string;
    onInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function PromptForm({ className, userInput, onInputChange, onSubmit }: PromptFormProps) {
    return (
        <div className={`${className} pb-12 px-24 sm:px-4 flex justify-center bg-slate-800 w-full`}>
            <form
                onSubmit={onSubmit}
                className={`flex items-center gap-3 p-4 bg-slate-700 rounded-md w-screen max-w-5xl focus-within:ring-2 focus-within:ring-green-600`}
            >
                <TextareaAutosize
                    id="user-text"
                    name="user-text"
                    value={userInput}
                    onChange={onInputChange}
                    placeholder="Please provide me with any context relevant to crafting your perfect menu."
                    minRows={1}
                    maxRows={20}
                    className="flex-1 resize-none p-1 bg-slate-700 border border-slate-700 rounded-md focus:outline-none text-white"
                />
                <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-medium p-3 focus:outline-none rounded-full"
                >
                    <FaArrowUp className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
