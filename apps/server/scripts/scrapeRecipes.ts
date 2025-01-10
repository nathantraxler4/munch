import ScrapedRecipeModel from '../src/models/scrapedRecipe';
import logger from '../src/utils/logger';
import axios from 'axios';
import * as cheerio from 'cheerio';

function _extractLinks(html: string) {
    const $ = cheerio.load(html);

    const links: string[] = [];
    $('a').each((index, element) => {
        const href = $(element).attr('href');
        const pattern = /^https:\/\/www\.allrecipes\.com\/recipe\/.+/;

        if (href && pattern.test(href)) {
            links.push(href);
        }
    });

    return links;
}

function setSubtraction<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    const result = new Set<T>();
    for (const elem of setA) {
        if (!setB.has(elem)) {
            result.add(elem);
        }
    }
    return result;
}

function _extractRecipe(html: string) {
    let recipe;

    const $ = cheerio.load(html);
    const jsonLd = $('script[type="application/ld+json"]').html();
    if (jsonLd) {
        const data = JSON.parse(jsonLd);
        if (Array.isArray(data)) {
            // Handle multiple JSON-LD entries
            recipe = data.find((item) => item['@type'].includes('Recipe'));
        } else {
            recipe = data;
        }
    }
    return recipe;
}

async function scrapeRecipes() {
    let links = ['https://www.allrecipes.com/recipe/216755/extra-yummy-fluffy-pancakes/'];
    const visitedLinks = new Set<string>();
    while (links.length > 0) {
        try {
            const link = links.shift() ?? '';
            const { data: html } = await axios.get(link);
            const extractedLinks = _extractLinks(html);
            const newLinks = setSubtraction<string>(new Set(extractedLinks), visitedLinks);
            links = Array.from(new Set([...links, ...newLinks]));
            const recipe = _extractRecipe(html);
            recipe.url = link;
            await ScrapedRecipeModel.create(recipe);
            visitedLinks.add(link);
        } catch (error) {
            logger.error(error);
        }
    }
    logger.info('Completed scrapping!');
}

scrapeRecipes().then(() => {
    logger.info('Completed scrapping!');
});
