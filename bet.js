
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const moment = require('moment');
const avoidingTimeOut = { waitUntil: "load", timeout: 0 }
const request = require("request-promise");
const $C = require("js-combinatorics/commonjs/combinatorics");

const calcServerURL = "http://127.0.0.1:5002/";
// let winOdds = {}
// let exactaOdds = {}

async function main() {
  let page;
  console.log("Logging in...")
  page = await login();
  console.log("Logged in")
  page = await toBettingPage(page);
  console.log("Getting today's race places")
  let racePlaces = await getRacePlaces(page);
  console.log("Race places len", racePlaces.length - 1)
  await hack(page, racePlaces[0])
}

async function login() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      // args: ['--proxy-server=socks5://127.0.0.1:9050']
    });
    const page = await browser.newPage();
    page.on('dialog', async dialog => {
      console.log(dialog.accept());
    });
    await page.setViewport({width: 1200, height: 1500});
    await page.goto(
      "https://www.oddspark.com/OpTop.do?SSO_FORCE_LOGIN=1&SSO_URL_RETURN=https://www.oddspark.com/",
      avoidingTimeOut
    );
    await page.waitForSelector("input[name='SSO_ACCOUNTID']");
    await page.type("input[name='SSO_ACCOUNTID']", "ID");
    await page.waitForSelector("input[name='SSO_PASSWORD']");
    await page.type("input[name='SSO_PASSWORD']", "PASSWORD");
    await page.click("#btn-login");
    await page.waitForSelector("input[name='INPUT_PIN']");
    await page.type("input[name='INPUT_PIN']", "0120");
    await page.click("input[value='確　認']");
    return page;
  } catch(error) {
    console.error(error);
  }
}

async function toBettingPage(page) {
  try {
    await page.waitForSelector("a[title='Close']");
    await page.click("a[title='Close']")
    await page.goto(
      "https://www.oddspark.com/keiba/auth/VoteKeibaTop.do",
      { waitUntil: 'networkidle0' },
    );
    await page.waitForSelector("a[title='Close']", { timeout: 1000 });
    await page.click("a[title='Close']")
    return page;
  } catch (error) {
    console.error(error);
    return page;
  }
}

async function getRacePlaces(page) {
  try {
    await page.waitForSelector(".active.mR15");
    let places = await page.$$(".active.mR15");
    return places
  } catch (error) {
    console.error(error);
  }
}

async function hack(page, racePlace) {
  try {
    racePlace.click();
    let deadLine = await setDeadLine(page);
    let timeoutLimit = deadLine.subtract(1, "s")
    console.log("Deadline:", deadLine.format('MMMM Do YYYY, h:mm:ss a'));
    let horseNumbers = await setHorseNumbers(page);
    console.log("Horse numbers:", horseNumbers);
    while (moment() < timeoutLimit) {
      console.log("Deadline:", deadLine.format('MMMM Do YYYY, h:mm:ss a'));
      console.log("Now:", moment().format('MMMM Do YYYY, h:mm:ss a'));
      console.log(`${timeoutLimit.diff(moment())} milliseconds to go...`)
      winOdds = await setWinOdds(page, horseNumbers);
      console.log("winOdds", winOdds);
      exactaOdds = await setExactaOdds(page, horseNumbers);
      console.log("exactaOdds", exactaOdds);
      tickets = await calc(winOdds, exactaOdds, 1);
      if (tickets) {
        let hasDiff = false;
        await makeSelection(page, tickets);
        while(!hasDiff && moment() < timeoutLimit) {
          await setBettingMode(page, "winOdds");
          hasDiff = await checkDiff(page, winOdds);
          console.log("Has Diff: ", hasDiff)
          await setBettingMode(page, "exactaOdds");
          hasDiff = await checkDiff(page, exactaOdds);
          console.log("Has Diff: ", hasDiff)
          console.log("Deadline:", deadLine.format('MMMM Do YYYY, h:mm:ss a'));
          console.log("Now:", moment().format('MMMM Do YYYY, h:mm:ss a'));
          console.log(`${timeoutLimit.diff(moment())} milliseconds to go...`)
        }
        if (hasDiff) {
          await page.waitForSelector("#all a");
          await page.click("#all a")
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function checkDiff(page, oddsObj) {
  try {
    for (const obj of Object.values(oddsObj).flat()) {
      await page.waitForSelector(obj.id);
      const html = await page.content();
      const $ = cheerio.load(html);
      if (+obj.odds !== +$(obj.id).text()) {
        return true
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function setDeadLine(page) {
  try {
    await page.waitForSelector("#raceInfo div.alert");
    const html = await page.content();
    const $ = cheerio.load(html);
    let deadLine = moment($("#raceInfo div.alert")[0].children[2].data, "hh:mm")
    return deadLine
  } catch (error) {
    console.error(error);
  }
}

async function setHorseNumbers(page) {
  try {
    await page.waitForSelector("#racetable table tr");
    const html = await page.content();
    const $ = cheerio.load(html);
    return Array.from({length: ($("#racetable table tr").length - 1)}, (_, i) => i + 1)
  } catch (error) {
    
  }
}

async function setBettingMode(page, oddsKindName) {
  try {
    await page.waitForSelector("#racenum li.active a");
    await page.click("#racenum li.active a");
    await page.waitForSelector("#mode1 .bt2");
    await page.click("#mode1 .bt2");
    await page.waitForFunction(
      'document.querySelector("#mode1 .bt2").parentNode.classList.value === "active"'
    )
    if (oddsKindName === 'winOdds') {
      await page.waitForSelector("#mode2 .bt1");
      await page.click("#mode2 .bt1");
      await page.waitForFunction(
        'document.querySelector("#mode2 .bt1").parentNode.classList.value === "active"'
      );
      await page.waitForFunction(
        'document.querySelector("#mode2 .bt6").parentNode.classList.value !== "active"'
      )
      await page.waitForSelector("#section4 .control h3");
      await page.waitForFunction(
        'document.querySelector("#section4 .control h3").textContent === "単勝　全オッズ"'
      );
    } else if (oddsKindName === 'exactaOdds') {
      await page.waitForSelector("#mode2 .bt6");
      await page.click("#mode2 .bt6");
      await page.waitForFunction(
        'document.querySelector("#mode2 .bt6").parentNode.classList.value === "active"'
      );
      await page.waitForFunction(
        'document.querySelector("#mode2 .bt1").parentNode.classList.value !== "active"'
      );
    }
    await page.waitForSelector("#oddsTableUpdate a");
    await page.click("#oddsTableUpdate a");
  } catch (error) {
    console.error(error);
  }
}

async function setWinOdds(page, horseNumbers) {
  try {
    winOdds = {};
    await setBettingMode(page, "winOdds");
    await page.waitForSelector("#voteOdds");
    for (const num of horseNumbers) {
      await page.waitForSelector(`tr#oddsRow-${num}`);
      const html = await page.content();
      const $ = cheerio.load(html);
      const odds = $(`tr#oddsRow-${num} a span`).text();
      if (+odds === 0) { continue; }
      if (odds !== "") {
        winOdds[num] = [
          {
            id: `tr#oddsRow-${num} a span`,
            odds: odds,
          }
        ];
      }
    }
    return winOdds;
  } catch (error) {
    console.error(error);
  }
}

async function setExactaOdds(page, horseNumbers) {
  try {
    exactaOdds = {};
    await setBettingMode(page, "exactaOdds");
    return Promise.all(
      await mapExtractionOddsFuncForExacta(
        page,
        horseNumbers
      )
    ).then(() => {
      return exactaOdds
    })
  } catch (error) {
    console.error(error);
  }
}

async function mapExtractionOddsFuncForExacta(page, horseNumbers) {
  try {
    return horseNumbers.flatMap(async (first) => {
      await Promise.all(
        horseNumbers.filter(n => first !== n).flatMap(async (second) => {
          return await extractOddsFromCellForExacta(page, first, second)
        })
      )
    });
  } catch (error) {
    console.error(error);
  }
}

async function extractOddsFromCellForExacta(page, first, second) {
  try {
    const ticket = `${('0' + first).slice(-2)}${('0' + second).slice(-2)}`;
    await page.waitForSelector(`#row-${ticket}`, { timeout: 1000 }); 
    const html = await page.content();
    const $ = cheerio.load(html);
    const odds = $(`#row-${ticket}`).text()
    if (exactaOdds[first] === undefined) {exactaOdds[first] = []; }
    if (+odds === 0) { return false; }
    if (odds !== "") {
      exactaOdds[first].push({
        id: `#row-${ticket}`,
        odds: odds,
      });
    }
    return exactaOdds;
  } catch (error) {
    console.error(error);
  }
}

async function calc(winOdds, exactaOdds, martingale = 1) {
  try {
    const targetNumbers = await findOddsDistortion(winOdds, exactaOdds);
    console.log("Target numbers:", targetNumbers);
    if (targetNumbers.length === 0) {
      console.log("Target numbers:", 0)
      return false;
    }
    let tickets = await findTicketsToBuy(targetNumbers, winOdds, exactaOdds)
    if (Object.keys(tickets).length > 0) {
      tickets = await findTheMostDeliciousTickets(tickets);
      const res = await request.get(
        `${calcServerURL}optimize_investments?tickets=${encodeURIComponent(JSON.stringify(tickets))}&martingale=${martingale}`
      );
      const contents = JSON.parse(res);
      const targetTickets = JSON.parse(contents.tickets);
      console.log("Tickets:", targetTickets);
      console.log("Total inv:", JSON.parse(contents.total_inv));
      console.log("Min payout:", JSON.parse(contents.min_payout));
      return targetTickets;
    } else {
      console.log("No tickets to buy");
      return false
    }
  } catch (error) {
    console.error(error);
  }
}

async function findOddsDistortion(winOdds, exactaOdds) {
  try {
    const horseNumbersWithDistortedOdds = [];
    for (const i of Object.keys(exactaOdds)) {
      const odds = exactaOdds[i].map(obj => obj.odds);
      const res = await request.get(
        `${calcServerURL}composite_odds?odds=${JSON.stringify(odds)}`
      );
      const composite_odds = JSON.parse(res)["composite_odds"];
      console.log("Win Odds : Composite Odds =>", `${winOdds[i][0].odds} : ${composite_odds}`);
      if (composite_odds > winOdds[i][0].odds) {
        horseNumbersWithDistortedOdds.push(i);
      }
    }
    return horseNumbersWithDistortedOdds;
  } catch (error) {
    console.error(error);
  }
}

async function findTicketsToBuy(targetNumbers, winOdds, exactaOdds) {
  try {
    const tickets = {};
    for (let i = 1; i <= targetNumbers.length; i++) {
      const p = new $C.Combination(targetNumbers, i);
      for (const numbers of p) {
        const target = JSON.parse(JSON.stringify(winOdds));
        const source = {};
        numbers.forEach(num => source[num] = exactaOdds[num]);
        Object.assign(target, source);
        const odds = Object.values(target).flat().map(obj => obj.odds);
        const res = await request.get(
          `${calcServerURL}composite_odds?odds=${JSON.stringify(odds)}`
        );
        const compositeOdds = JSON.parse(res)["composite_odds"];
        console.log("Composite Odds", compositeOdds);
        if (compositeOdds > 1) {
        // if (compositeOdds >= 1.5) {
          tickets[compositeOdds] = target;
        }
      }
    }
    return tickets;
  } catch (error) {
    console.error(error);
  }
}

async function findTheMostDeliciousTickets(tickets) {
  try {
    return tickets[
      Math.max.apply(
        Math, Object.keys(tickets).map(compositeOdds => +compositeOdds)
      )
    ];
  } catch (error) {
    console.error(error);
  }
}

async function makeSelection(page, tickets) {
  try {
    let kaimeNum = 1
    for (const obj of Object.values(tickets).flat()) {
      await setBettingMode(page, obj.id.startsWith("tr") ? "winOdds" : "exactaOdds");
      await page.waitForSelector(obj.id);
      const html = await page.content();
      const $ = cheerio.load(html);
      await page.click(obj.id);
      await page.waitForSelector(`#kaime${kaimeNum} input[name='textfield']`);
      const input = await page.$(`#kaime${kaimeNum} input[name='textfield']`);
      await input.click({ clickCount: 3 })
      await input.type(`${Math.floor(obj.inv)}`.slice(0, -2));
      kaimeNum++
    }
  } catch (error) {
    console.error(error);
  }
}

main()