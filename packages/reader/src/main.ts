import { init, toNextPage, toPrevPage } from "./reader"

function setHTML(html: string) {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = html
}

window.onload = async function() {
  // const width = window.innerWidth
  // const height = window.innerHeight
  // console.log(width, height)
  
  setHTML(await init())

}

