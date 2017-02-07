const baseUrl = '';

const Crawler = require("simplecrawler");
let crawler = new Crawler(baseUrl);
let cheerio = require('cheerio');
const htmlToText = require('html-to-text');
const randomUA = require('random-ua');

crawler.interval = 2 * 1000;
crawler.maxConcurrency = 1;
crawler.maxDepth = 5;
crawler.userAgent = randomUA.generate();


// var webdriverio = require('webdriverio');
//   var options = {
//     desiredCapabilities: {
//       browserName: 'phantomjs'
//         // browserName: 'chrome'
//     }
//   };
//   var client = webdriverio.remote(options);
//   client
//     .init()
//     .url(url)
//     .getSource().then(function(source) {

//     })
//     .end();


crawler.on("crawlstart", function() {
    console.log("Crawl starting");
});

// 準備要抓，可以 override request option。
crawler.on("fetchstart", function(queueItem, requestOptions) {
    // console.log("fetchStart", queueItem);
});

// 驗證是否為正確的課表圖檔路徑格式
function isClassScheduleImageUrl(url) {
    return url && url.indexOf('Img_ClassSchedule') > -1;
}

// 將 html 移除，只留下純文字
function getData(htmlString) {
  const data = htmlToText.fromString(htmlString, {
    wordwrap: 130
  });
  return data;
}

let results = [];

// 從 queue 中取出，發 request 取得 html source。
crawler.on("fetchcomplete", function(queueItem, responseBuffer, responseObject) {
    // console.log("fetchcomplete", queueItem);
    const url = queueItem.url;
    if(url == baseUrl) return;
    // console.log("fetchcomplete url:", queueItem.url);
    // console.log(responseBuffer.toString());
    let $ = cheerio.load(responseBuffer);
    let classScheduleImageUrl = $('.mainContent a img').attr('src');
    let name = getData($('.mainContent .fontWht'));
    if(isClassScheduleImageUrl(classScheduleImageUrl)){
        console.log('\n'+ name);
        console.log(baseUrl + classScheduleImageUrl);
        results.push({
            name: name,
            url: baseUrl + classScheduleImageUrl
        });
    }

    crawler.queue.countItems({ fetched: true }, function(error, count) {
        console.log("The number of completed items is %d", count);

    });

    if(results.length == 27){
        process.exit();
    }
});

// 整個網站都探索完，而且 queue 中的 item 都已經完成了。
crawler.on("complete", function() {
    console.log("Finished!");
});

// 抓取條件
crawler.addFetchCondition(function(queueItem, referrerQueueItem) {
  return queueItem.path.indexOf('BRANCHES') > -1 && queueItem.path.indexOf('SMenu') > -1;
});

crawler.start();
