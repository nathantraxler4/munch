import { gql } from '@apollo/client';

export const PROMPT_AGENT = gql`
    mutation PromptAgent($prompt: String!) {
        promptAgent(prompt: $prompt) {
            id
            message
            recipes {
                name
                ingredients
                instructions
            }
            menu {
                courses {
                    description
                    name
                    url
                }
                backgroundImage
            }
        }
    }
`;
