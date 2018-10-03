import puppeteer = require('puppeteer');
import * as csv_handler from "./csv_handler"; // contains papaparse functions
import * as pup_helper from "./puppeteer_helper"; // Generic puppeteer functions

//-------------------------------- Constants --------------------------------//
const mainUrl = "http://www.website.com/"; // has to start with http:// or https://
const CSV_PATH = './csv/';
const CSV_FILE_NAME = 'links.csv';
const CSV_FULL_PATH = CSV_PATH + CSV_FILE_NAME;
const HEADLESS_SETTING: boolean = true; // true if you want to hide the browser
const NUM_ERR_ITERATION = 2;
const EXCEPTIONS = [".pdf",".jpg",".png",".doc",".docx",".xls",".xml","xlsx","#","?","%"];
const ALLOW = [];
//-------------------------------- Classes --------------------------------//
class Link {
    link:string;
}
//-------------------------------- Functions --------------------------------//

main();

export async function main(){
    var linksArr:Link[] = [];
    linksArr.push({"link":mainUrl});
    console.log(linksArr[0].link)
    console.log("Opening Browser");
    const browser =  await puppeteer.launch({
        headless: HEADLESS_SETTING // true if you want to hide the browser
      });
    const page = await browser.newPage();
      linksArr = await getAllWebLinks(page,linksArr);
      console.log("Getting Links: Done!");
      await page.close();
      await browser.close();
      // Exporting to csv
      console.log("Exporting to CSV. Path: " + CSV_FULL_PATH);
      //csv_handler.exportArrToCSV(convertToJSON(linksArr),CSV_FULL_PATH);
      csv_handler.exportArrToCSV(linksArr,CSV_FULL_PATH);
}

// Checks if the link is a related to the mainUrl and compare the link to exception array. Returns true if link is okay.
function checkLinkExcept(link:string,excepArr: string[]){
    if(!link.includes(mainUrl))
        return false;
    for(var i=0; i<excepArr.length; i++){
        if(link.includes(excepArr[i]))
            return false;
    }
    return true;
}

// Getting all the links from a single webpage
async function getLinks(link:string, page){
    var pageLinks:string[] = [];
    try{
    await pup_helper.navigateTo(page,link);
    pageLinks = await page.evaluate(()=>{
        pageLinks = [];
        const anchors = document.body.getElementsByTagName('a');
        const nodes = Array.prototype.slice.call(anchors); // Converts the anchors array from NodeList to array
        // getting the links from the anchor tags
        nodes.forEach((node)=>
             pageLinks.push(node.href)
            )
        return pageLinks;
    },); // End of evaluation
    }
    catch(err){
        console.log("there was an error getting the links of: " + link + " error:  " + err);
        // In this case, an empty array is returned.
    }
    return pageLinks;
}

// Getting all the links of a website (checks ONLY the domain of the website)
async function getAllWebLinks(page, linksArr:Link[]){
    var counter = 0;
    var pageLinksArr: string[] = [];
    // How do I check errors in the while?
    while((pageLinksArr = await getLinks(linksArr[counter].link, page)) && linksArr[counter]){
        console.log("Going Through: " + linksArr[counter].link);
        for(var i: number = 0; i<pageLinksArr.length; i++){
            // Checking whether the link exists on the cumulative array and is a child of the main domain
            if(!checkIfElemExists(linksArr, pageLinksArr[i]) && checkLinkExcept(pageLinksArr[i],EXCEPTIONS))
                linksArr.push({"link":pageLinksArr[i]});
        }
        counter++;
    }
    return linksArr;
}

function checkIfElemExists (arr:Link[], elem:string){
    for(var i = 0; i < arr.length; i++){
        if(arr[i].link == elem){
            return true;
        }
    }
    return false;
}


/* Unused:

// Checks if the link is a related to the mainUrl and contains at least one element of the allowance array. Returns true if link is okay.
function checkLinkAllowance(link:string,allowArr: string[]){
    if(!link.includes(mainUrl))
        return false;
    for(var i=0; i<allowArr.length; i++){
        if(link.includes(allowArr[i]))
            return true;
    }
    return false;
}

*/