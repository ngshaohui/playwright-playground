import playwright from 'playwright'

const F4BB1T_BASE_URL = 'https://f4bb1t.com'
const F4BB1T_POSTS = `${F4BB1T_BASE_URL}/post`
const F4BB1T_POSTS_PAGE = `${F4BB1T_BASE_URL}/post/page`
const POST_REGEX = new RegExp(
  'https://f4bb1t.com/post/(\\d{4})/(\\d{2})/(\\d{2})/(.{1,})/',
)
const MAX_PAGES = 10

export async function scrape(): Promise<void> {
  const browser = await playwright.chromium.launch({
    // headless: false,
    // slowMo: 50,
  })
  const context = await browser.newContext()
  const page = await context.newPage()
  await traverse(page)
  await browser.close()
}

async function traverse(page: playwright.Page) {
  try {
    for (let i = 1; i < MAX_PAGES; i++) {
      await page.goto(`${F4BB1T_POSTS_PAGE}/${i}`, {
        waitUntil: 'networkidle',
      })
      const urls = await getPageUrls(page)
      const postUrls = urls.filter(isPostUrl)
      for (let j = 0; j < postUrls.length; j++) {
        await page.goto(postUrls[j], {
          waitUntil: 'networkidle',
        })
        await screenshotFullpage(page)
      }
      console.log(`Done with page ${i}`)
    }
  } catch (e) {
    console.log(e)
  }
}

function isPostUrl(url: string): boolean {
  return POST_REGEX.test(url)
}

// traverse /post/ page
async function getPageUrls(page: playwright.Page): Promise<string[]> {
  try {
    return page.$$eval('a', (elements) => elements.map((el) => el.href))
  } catch (e) {
    return []
  }
}

async function screenshotFullpage(page: playwright.Page): Promise<void> {
  const url = page.url()
  // convert url to proper filename
  const fileName = url
    .replace(`${F4BB1T_POSTS}/`, '') // remove base path
    .replace(/\//g, '-') // replace /slashes with -dashes
    .replace(/-$/, '') // remove trailing dash
  await page.screenshot({
    path: `./screenshots/${fileName}.png`,
    fullPage: true,
  })
}
