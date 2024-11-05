**The project is developing**

### Supposing usage

Because it involves file operations, such as read `.epub` file and parse xml. So this pkg now cannot run in browser, it could run in the platform that support node.

```typescript
// from packages/reader/src/reader.ts
import { Reader } from 'svg-ebook-reader'
const reader = Reader('./example/alice.epub')
const {
  toPrevPage,
  toNextPage,
  getPageIndex,
  getChapterIndex,
  getCurrChapterPageCount,
} = reader

;(async () => {
  // get the first page of this book,
  //  and it could init specific page of other chapter when pass some pamameters, but this feature has not been implemented
  const currentPage = await reader.init()

  // get previous page svg string, it will return undefined if the current page is the first page in the first chapter
  // when entering the next chapter, it will automatically load the next chapter after the next in Promise, toNextPage() is the same
  const prevPage = toPrevPage()

  // get next page svg string, it will return undefined if the current page is the last page in the last chapter
  const nextPage = toNextPage()
})()
```

### The current render result

Now, it could only render one colume. This project will also support two/three line rendering in the future. you could adjust width/height and x/y to support this.

![0-2](example/example1.svg)

![0-2](example/example2.svg)
