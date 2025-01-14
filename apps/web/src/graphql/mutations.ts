import { gql } from '@apollo/client';

export const GENERATE_MENU_FROM_PROMPT = gql`
    mutation GenerateMenuFromPrompt($prompt: String!) {
        generateMenuFromPrompt(prompt: $prompt) {
            backgroundImage
            courses {
                name
                description
                url
            }
        }
    }
`;
