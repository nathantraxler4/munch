import { FaArrowUp } from 'react-icons/fa';
import TextareaAutosize from 'react-textarea-autosize';

interface PromptFormProps {
    userInput: string;
    onInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    isLoading?: boolean;
}

export function PromptForm({ userInput, onInputChange, onSubmit, isLoading }: PromptFormProps) {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
        }
    };
    
    return (
        <div className={`pt-4 pb-12  flex justify-center bg-slate-800 w-full`}>
            <form
                onSubmit={onSubmit}
                className={`flex items-center gap-3 p-4 bg-slate-700 rounded-md w-screen max-w-5xl focus-within:ring-2 focus-within:ring-green-600`}
            >
                <TextareaAutosize
                    id="user-text"
                    name="user-text"
                    value={userInput}
                    onChange={onInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Please provide me with any context relevant to crafting your perfect menu."
                    minRows={1}
                    maxRows={20}
                    className="flex-1 resize-none p-1 bg-slate-700 border border-slate-700 rounded-md focus:outline-none text-white disabled:opacity-50"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-medium p-3 focus:outline-none rounded-full disabled:opacity-50 disabled:hover:bg-green-600"
                    disabled={isLoading}
                >
                    <FaArrowUp className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
