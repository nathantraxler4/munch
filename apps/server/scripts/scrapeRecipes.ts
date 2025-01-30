import axios from 'axios';
import * as cheerio from 'cheerio';
import mongoose from 'mongoose';
import ScrapedRecipeModel from '../src/models/scrapedRecipe';
import logger from '../src/utils/logger';

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
    mongoose.connect('mongodb://127.0.0.1:27017/test');

    const savedRecipes = await ScrapedRecipeModel.find({});
    const savedLinks = savedRecipes.map((sr) => sr.url);
    let frontierLinks: string[] = [];
    const visitedLinks = new Set<string>(savedLinks);

    let i = savedLinks.length - 1;
    while (frontierLinks.length < 10) {
        const oldLink = savedLinks[i];
        const [, updatedFrontierLinks] = await getHTMLAndUpdateFrontierLinks(
            oldLink,
            frontierLinks,
            visitedLinks
        );
        frontierLinks = updatedFrontierLinks;
        i--;
    }

    let count = 0;
    while (frontierLinks.length > 0) {
        try {
            if (count % 10 == 0)
                logger.info({
                    numLinksInQueue: frontierLinks.length,
                    numVisitedLinks: visitedLinks.size
                });
            const link = frontierLinks.shift() ?? '';
            const [html, updatedFrontierLinks] = await getHTMLAndUpdateFrontierLinks(
                link,
                frontierLinks,
                visitedLinks
            );
            frontierLinks = updatedFrontierLinks;
            const recipe = _extractRecipe(html);
            recipe.url = link;
            if (!visitedLinks.has(link)) {
                try {
                    logger.info(`Saving Recipe with url: ${link}`);
                    await ScrapedRecipeModel.create(recipe);
                } catch (error) {
                    logger.error(`An error occurred: ${error} `);
                }
            }
            visitedLinks.add(link);
            count++;
        } catch (error) {
            logger.error(error);
        }
    }
    logger.info('Completed scrapping!');
}

async function getHTMLAndUpdateFrontierLinks(
    link: string,
    frontierLinks: string[],
    visitedLinks: Set<string>
) {
    let htmlData;
    try {
        const { data: html } = await axios.get(link);
        htmlData = html;
    } catch (error) {
        logger.error(`An error occurred accessing ${link}`, error);
    }
    const extractedLinks = _extractLinks(htmlData);
    const newLinks = setSubtraction<string>(new Set(extractedLinks), visitedLinks);
    frontierLinks = Array.from(new Set([...frontierLinks, ...newLinks]));
    return [htmlData, frontierLinks];
}

(async () => {
    try {
        await scrapeRecipes();
        logger.info('Completed scraping!');
    } catch (error) {
        logger.error(`An error occurred: ${error}`);
    } finally {
        try {
            await mongoose.connection.close();
            logger.info('Closed database connection!');
        } catch (closeError) {
            logger.error(`Failed to close database connection: ${closeError}`);
        }
    }
})();
