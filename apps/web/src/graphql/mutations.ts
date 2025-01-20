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

export const GENERATE_MENU_FROM_PROMPT_STREAM = gql`
    subscription Subscription($prompt: String!) {
        generateMenuFromPrompt(prompt: $prompt) {
            __typename
            ... on PartialMenu {
                backgroundImage
                courses {
                    name
                    description
                    url
                }
            }
            ... on StreamError {
                message
                code
            }
        }
    }
`;
