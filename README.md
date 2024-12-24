**The project is developing**

Now you can visit the site [https://hhk-png.github.io/blingo-reader/]( https://hhk-png.github.io/blingo-reader/ ) to see some features of this reader, although it is incomplete and there are many features need to be added.

The next step is to complete the parser of unencrypted .mobi, azw, azw3, etc. file  and the reader ui. I'm exploring whether it could be possible to provide a unified API for different eBook file parser. This will save a lot of things. I will publish these parsing libraries to npm later.

## TODO：

1. the UI of the homepage is ugly and needs to be adjested.
2. add a link to blingo-reader github on the homepage.
3. add a new way to open files. Enable users to open file via urls.
4. add navMap in Book page.
5. handle jump logic when user click an \<a\> tag dynamically rendered.
6. the `xml2js` and `jszip` are very large. Find a way to reduce their size.
7. adjust ui in book page.
8. exploring a unified api for different ebook file parser.
9. picture preview
10. use scroll api to finish column reader
