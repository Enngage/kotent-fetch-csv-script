import {createDeliveryClient, IContentItem} from '@kentico/kontent-delivery';
import striptags from 'striptags';
import { green, yellow } from 'colors';
import { createObjectCsvWriter } from 'csv-writer';

const languageCodename: string = 'global';
const productTypeCodename: string = 'product';
const filterElementCodename: string = 'basemodeloverview';
const characterSizeLimit: number = 250;
const pageSize: number = 500;
const csvFilename: string = 'products.csv';
const includeElementsWithLength: string[] = [
    'displaybasemodelshortdesc',
    'displaybasemodellongdesc',
    'basemodeloverview'
];
const includeElements: string[] = [
    'sfbasemodelid'
];

const allElements: string[] = [
    filterElementCodename,
    ...includeElements,
    ...includeElementsWithLength
];

const client = createDeliveryClient({
    projectId: 'ecb176a6-5a2e-0000-8943-84491e5fc8d1'
});

function getLengthName(element: string): string {
    return `${element}_length`
}

const main = async () => {
    const products = (await client.items()
        .languageParameter(languageCodename)
        .limitParameter(pageSize)
        .type(productTypeCodename)
        .elementsParameter(allElements)
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
        const valueWithoutTags = striptags(product.elements[filterElementCodename].value);

        if (valueWithoutTags.length <= characterSizeLimit) {
            filteredItems.push(product);
        }
    }

    console.log(`Filtered '${green(filteredItems.length.toString())}' products matching given criteria`);
    
    console.log(`Saving filtered products to '${yellow(csvFilename)}'`);

    const headers: any[] = [ 
        {id: 'id', title: 'Id'},
        {id: 'name', title: 'Name'},
        {id: 'codename', title: 'Codename'},
        {id: 'lastModified', title: 'LastModified'},
    ];

    for (const element of includeElementsWithLength) {
        headers.push({
            id: element,
            title: element
        }, {
            id: getLengthName(element),
            title: getLengthName(element)
        })
    }

    for (const element of includeElements) {
        headers.push({
            id: element,
            title: element
        })
    }

    const csvWriter = createObjectCsvWriter({
        path: csvFilename,
        alwaysQuote: true,
        header: headers
    });

    const records = filteredItems.map(m => {
        const record: any =  {
            id: m.system.id,
            name: m.system.name,
            codename: m.system.codename,
            lastModified: m.system.lastModified
        };

        for (const element of includeElementsWithLength) {
            const value = striptags(m.elements[element].value);
            record[element] = value;
            record[getLengthName(element)] = value.length;
        }

        for (const element of includeElements) {
            const value = striptags(m.elements[element].value);
            record[element] = value;
        }

        return record;
    });

    await csvWriter.writeRecords(records);

    console.log(`File '${yellow(csvFilename)}' successfully created`)
}


main();