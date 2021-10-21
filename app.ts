import {createDeliveryClient, IContentItem} from '@kentico/kontent-delivery';
import striptags from 'striptags';
import { green, yellow } from 'colors';
import { createObjectCsvWriter } from 'csv-writer';

const languageCodename: string = 'global';
const productTypeCodename: string = 'product';
const elementCodename: string = 'basemodeloverview';
const characterSizeLimit: number = 250;
const pageSize: number = 500;
const csvFilename: string = 'products.csv';

const client = createDeliveryClient({
    projectId: 'ecb176a6-5a2e-0000-8943-84491e5fc8d1'
});

const main = async () => {

    const products = (await client.items()
        .languageParameter(languageCodename)
        .limitParameter(pageSize)
        .type(productTypeCodename)
        .elementsParameter([elementCodename])
        .depthParameter(0)
        .toAllPromise({
            responseFetched: (response) => {
                console.log(`Fetched '${yellow(response.data.items.length.toString())}' items from API`)
            }
        })).data.items;

    const filteredItems: IContentItem[] = [];

    console.log(`Loaded '${yellow(products.length.toString())}' products from Delivery API`);

    for(const product of products) {
        // strip html tags from element
        const valueWithoutTags = striptags(product.elements[elementCodename].value);

        if (valueWithoutTags.length <= characterSizeLimit) {
            filteredItems.push(product);
        }
    }

    console.log(`Filtered '${green(products.length.toString())}' products matching given criteria`);
    
    console.log(`Saving filtered products to '${yellow(csvFilename)}'`);

    const csvWriter = createObjectCsvWriter({
        path: csvFilename,
        alwaysQuote: true,
        header: [
            {id: 'id', title: 'Id'},
            {id: 'name', title: 'Name'}
        ]
    });

    const records = filteredItems.map(m => {
        return {
            id: m.system.id,
            name: m.system.name
        };
    });

    await csvWriter.writeRecords(records);

    console.log(`File '${yellow(csvFilename)}' successfully created`)
}


main();