import puppeteer, { Page } from 'puppeteer'
import { schedule } from 'node-cron'
import axios from 'axios'

const { EMAIL, PASSWORD, SPOTIFY_TOKEN } = process.env

const sleep = (timeout: number) =>
  new Promise((resolve) => setTimeout(resolve, timeout))

const clearInput = async (page: Page, selector: string) => {
  await page.focus(selector)
  await page.keyboard.down('Control')
  await page.keyboard.press('KeyA')
  await page.keyboard.up('Control')
  await page.keyboard.press('Backspace')
}

const executeAuth = async () => {
  try {
    const browser = await puppeteer.launch({
      userDataDir: './session',
    })
    const page = await browser.newPage()

    await page.waitForSelector('#i0116')
    // @ts-ignore
    await page.$eval('#i0116', (el) => (el.value = EMAIL))

    await page.click('#idSIButton9')

    await sleep(1000)
    // @ts-ignore
    await page.$eval('#i0118', (el) => (el.value = PASSWORD))
    await page.click('#idSIButton9')
    await sleep(3000)
    await page.click('#idSIButton9')

    await sleep(10000)

    await browser.close()

    await main()
  } catch (err) {
    console.error(err)
  }
}

const setSkypeStatus = async (currentlyPlayingSong: string) => {
  try {
    const browser = await puppeteer.launch({
      userDataDir: './session',
    })

    const page = await browser.newPage()
    await page.goto('https://web.skype.com/', { waitUntil: 'networkidle2' })

    await page.click(
      'body > div.app-container > div > div > div:nth-child(1) > div.css-1dbjc4n.r-13awgt0 > div > div > div > div > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > button > div > div'
    )

    await sleep(3000)
    const statusInputSelector =
      'body > div.app-container > div > div > div:nth-child(1) > div.css-1dbjc4n.r-13awgt0 > div > div > div > div:nth-child(2) > div:nth-child(3) > div > div > div > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > input[type=text]'

    await clearInput(page, statusInputSelector)

    await sleep(1000)

    await page.focus(statusInputSelector)
    await page.keyboard.type(currentlyPlayingSong)

    await sleep(1000)
    await page.click(
      'body > div.app-container > div > div > div:nth-child(1) > div.css-1dbjc4n.r-13awgt0 > div:nth-child(2) > div > div > div:nth-child(2) > div:nth-child(3) > div > div > div > div > div:nth-child(1) > div:nth-child(3) > button > div > div:nth-child(2) > div'
    )

    await sleep(3000)
    await browser.close()
  } catch (err) {
    executeAuth()
  }
}

const getCurrentlyPlayingSong = async () => {
  const { data: currentTrack } = await axios.get(
    'https://api.spotify.com/v1/me/player/currently-playing',
    {
      headers: {
        Authorization: `Bearer ${SPOTIFY_TOKEN}`,
      },
    }
  )

  const songName = `${currentTrack.item.name} - ${currentTrack.item.artists[0].name}`

  return songName
}

const main = async () => {
  const currentlyPlayingSong = await getCurrentlyPlayingSong()
  await setSkypeStatus(currentlyPlayingSong)
}
main()

schedule('* * * * *', () => {
  console.log('cron')
  main()
})
