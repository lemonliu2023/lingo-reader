import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { Parser, parseString, parseStringPromise } from '../src/xml2js-parser'

const fileName = path.join(__dirname, '/fixtures/sample.xml')

function skeleton(options: any, checks: (result: any) => void) {
  return () => {
    const xmlString = options?.__xmlString
    delete options?.__xmlString
    const x2js = new Parser(options)

    return new Promise<void>((resolve, reject) => {
      x2js.addListener('end', (r: any) => {
        try {
          checks(r)
          resolve()
        }
        catch (err) {
          reject(err)
        }
      })

      if (!xmlString) {
        fs.readFile(fileName, 'utf8', (err, data) => {
          if (err) {
            reject(err)
            return
          }
          data = data.split(os.EOL).join('\n')
          x2js.parseString(data)
        })
      }
      else {
        x2js.parseString(xmlString)
      }
    })
  }
}

function nameToUpperCase(name: string): string {
  return name.toUpperCase()
}

function nameCutoff(name: string): string {
  return name.slice(0, 4)
}

function replaceValueByName(_: string, name: string): string {
  return name
}

function validator(xpath: string, currentValue: any, newValue: any): any {
  if (xpath === '/sample/validatortest/numbertest') {
    return Number(newValue)
  }
  else if (['/sample/arraytest', '/sample/validatortest/emptyarray', '/sample/validatortest/oneitemarray'].includes(xpath)) {
    if (!newValue || !('item' in newValue)) {
      return { item: [] }
    }
  }
  else if (['/sample/arraytest/item', '/sample/validatortest/emptyarray/item', '/sample/validatortest/oneitemarray/item'].includes(xpath)) {
    if (!currentValue) {
      return newValue
    }
  }
  else if (xpath === '/validationerror') {
    throw new Error('Validation error!')
  }
  return newValue
}

describe('xml2js parser tests', () => {
  it('test parse with defaults', skeleton(undefined, (r) => {
    expect(r.sample.chartest[0].$.desc).toBe('Test for CHARs')
    expect(r.sample.chartest[0]._).toBe('Character data here!')
    expect(r.sample.cdatatest[0].$.desc).toBe('Test for CDATA')
    expect(r.sample.cdatatest[0].$.misc).toBe('true')
    expect(r.sample.cdatatest[0]._).toBe('CDATA here!')
    expect(r.sample.nochartest[0].$.desc).toBe('No data')
    expect(r.sample.nochartest[0].$.misc).toBe('false')
    expect(r.sample.listtest[0].item[0]._).toBe('\n            This  is\n            \n            character\n            \n            data!\n            \n        ')
    expect(r.sample.listtest[0].item[0].subitem[0]).toBe('Foo(1)')
    expect(r.sample.listtest[0].item[0].subitem[1]).toBe('Foo(2)')
    expect(r.sample.listtest[0].item[0].subitem[2]).toBe('Foo(3)')
    expect(r.sample.listtest[0].item[0].subitem[3]).toBe('Foo(4)')
    expect(r.sample.listtest[0].item[1]).toBe('Qux.')
    expect(r.sample.listtest[0].item[2]).toBe('Quux.')
    expect(Object.keys(r.sample.tagcasetest[0])).toHaveLength(3)
  }))

  it('test parse with empty objects and functions', skeleton({ emptyTag: () => ({}) }, (r) => {
    const bool = r.sample.emptytestanother[0] === r.sample.emptytest[0]
    expect(bool).toBe(false)
  }))

  it('test parse with explicitCharkey', skeleton({ explicitCharkey: true }, (r) => {
    expect(r.sample.chartest[0].$.desc).toBe('Test for CHARs')
    expect(r.sample.chartest[0]._).toBe('Character data here!')
    expect(r.sample.cdatatest[0].$.desc).toBe('Test for CDATA')
    expect(r.sample.cdatatest[0].$.misc).toBe('true')
    expect(r.sample.cdatatest[0]._).toBe('CDATA here!')
    expect(r.sample.nochartest[0].$.desc).toBe('No data')
    expect(r.sample.nochartest[0].$.misc).toBe('false')
    expect(r.sample.listtest[0].item[0]._).toBe('\n            This  is\n            \n            character\n            \n            data!\n            \n        ')
    expect(r.sample.listtest[0].item[0].subitem[0]._).toBe('Foo(1)')
    expect(r.sample.listtest[0].item[0].subitem[1]._).toBe('Foo(2)')
    expect(r.sample.listtest[0].item[0].subitem[2]._).toBe('Foo(3)')
    expect(r.sample.listtest[0].item[0].subitem[3]._).toBe('Foo(4)')
    expect(r.sample.listtest[0].item[1]._).toBe('Qux.')
    expect(r.sample.listtest[0].item[2]._).toBe('Quux.')
  }))

  it('test parse with mergeAttrs', skeleton({ mergeAttrs: true }, (r) => {
    expect(r.sample.chartest[0].desc[0]).toBe('Test for CHARs')
    expect(r.sample.chartest[0]._).toBe('Character data here!')
    expect(r.sample.cdatatest[0].desc[0]).toBe('Test for CDATA')
    expect(r.sample.cdatatest[0].misc[0]).toBe('true')
    expect(r.sample.cdatatest[0]._).toBe('CDATA here!')
    expect(r.sample.nochartest[0].desc[0]).toBe('No data')
    expect(r.sample.nochartest[0].misc[0]).toBe('false')
    expect(r.sample.listtest[0].item[0].subitem[0]).toBe('Foo(1)')
    expect(r.sample.listtest[0].item[0].subitem[1]).toBe('Foo(2)')
    expect(r.sample.listtest[0].item[0].subitem[2]).toBe('Foo(3)')
    expect(r.sample.listtest[0].item[0].subitem[3]).toBe('Foo(4)')
    expect(r.sample.listtest[0].item[1]).toBe('Qux.')
    expect(r.sample.listtest[0].item[2]).toBe('Quux.')
    expect(r.sample.listtest[0].single[0]).toBe('Single')
    expect(r.sample.listtest[0].attr[0]).toBe('Attribute')
  }))

  it('test parse with mergeAttrs and not explicitArray', skeleton({ mergeAttrs: true, explicitArray: false }, (r) => {
    expect(r.sample.chartest.desc).toBe('Test for CHARs')
    expect(r.sample.chartest._).toBe('Character data here!')
    expect(r.sample.cdatatest.desc).toBe('Test for CDATA')
    expect(r.sample.cdatatest.misc).toBe('true')
    expect(r.sample.cdatatest._).toBe('CDATA here!')
    expect(r.sample.nochartest.desc).toBe('No data')
    expect(r.sample.nochartest.misc).toBe('false')
    expect(r.sample.listtest.item[0].subitem[0]).toBe('Foo(1)')
    expect(r.sample.listtest.item[0].subitem[1]).toBe('Foo(2)')
    expect(r.sample.listtest.item[0].subitem[2]).toBe('Foo(3)')
    expect(r.sample.listtest.item[0].subitem[3]).toBe('Foo(4)')
    expect(r.sample.listtest.item[1]).toBe('Qux.')
    expect(r.sample.listtest.item[2]).toBe('Quux.')
    expect(r.sample.listtest.single).toBe('Single')
    expect(r.sample.listtest.attr).toBe('Attribute')
  }))

  it('test parse with explicitChildren', skeleton({ explicitChildren: true }, (r) => {
    expect(r.sample.$$.chartest[0].$.desc).toBe('Test for CHARs')
    expect(r.sample.$$.chartest[0]._).toBe('Character data here!')
    expect(r.sample.$$.cdatatest[0].$.desc).toBe('Test for CDATA')
    expect(r.sample.$$.cdatatest[0].$.misc).toBe('true')
    expect(r.sample.$$.cdatatest[0]._).toBe('CDATA here!')
    expect(r.sample.$$.nochartest[0].$.desc).toBe('No data')
    expect(r.sample.$$.nochartest[0].$.misc).toBe('false')
    expect(r.sample.$$.listtest[0].$$.item[0]._).toBe('\n            This  is\n            \n            character\n            \n            data!\n            \n        ')
    expect(r.sample.$$.listtest[0].$$.item[0].$$.subitem[0]).toBe('Foo(1)')
    expect(r.sample.$$.listtest[0].$$.item[0].$$.subitem[1]).toBe('Foo(2)')
    expect(r.sample.$$.listtest[0].$$.item[0].$$.subitem[2]).toBe('Foo(3)')
    expect(r.sample.$$.listtest[0].$$.item[0].$$.subitem[3]).toBe('Foo(4)')
    expect(r.sample.$$.listtest[0].$$.item[1]).toBe('Qux.')
    expect(r.sample.$$.listtest[0].$$.item[2]).toBe('Quux.')
    expect(r.sample.$$.nochildrentest[0].$$).toBeUndefined()
    expect(Object.keys(r.sample.$$.tagcasetest[0].$$)).toHaveLength(3)
  }))

  it('test parse with explicitChildren and preserveChildrenOrder', skeleton({ explicitChildren: true, preserveChildrenOrder: true }, (r) => {
    expect(r.sample.$$[10]['#name']).toBe('ordertest')
    expect(r.sample.$$[10].$$[0]['#name']).toBe('one')
    expect(r.sample.$$[10].$$[0]._).toBe('1')
    expect(r.sample.$$[10].$$[1]['#name']).toBe('two')
    expect(r.sample.$$[10].$$[1]._).toBe('2')
    expect(r.sample.$$[10].$$[2]['#name']).toBe('three')
    expect(r.sample.$$[10].$$[2]._).toBe('3')
    expect(r.sample.$$[10].$$[3]['#name']).toBe('one')
    expect(r.sample.$$[10].$$[3]._).toBe('4')
    expect(r.sample.$$[10].$$[4]['#name']).toBe('two')
    expect(r.sample.$$[10].$$[4]._).toBe('5')
    expect(r.sample.$$[10].$$[5]['#name']).toBe('three')
    expect(r.sample.$$[10].$$[5]._).toBe('6')
  }))

  it('test parse with explicitChildren and charsAsChildren and preserveChildrenOrder', skeleton({
    explicitChildren: true,
    preserveChildrenOrder: true,
    charsAsChildren: true,
  }, (r) => {
    expect(r.sample.$$[10]['#name']).toBe('ordertest')
    expect(r.sample.$$[10].$$[0]['#name']).toBe('one')
    expect(r.sample.$$[10].$$[0]._).toBe('1')
    expect(r.sample.$$[10].$$[1]['#name']).toBe('two')
    expect(r.sample.$$[10].$$[1]._).toBe('2')
    expect(r.sample.$$[10].$$[2]['#name']).toBe('three')
    expect(r.sample.$$[10].$$[2]._).toBe('3')
    expect(r.sample.$$[10].$$[3]['#name']).toBe('one')
    expect(r.sample.$$[10].$$[3]._).toBe('4')
    expect(r.sample.$$[10].$$[4]['#name']).toBe('two')
    expect(r.sample.$$[10].$$[4]._).toBe('5')
    expect(r.sample.$$[10].$$[5]['#name']).toBe('three')
    expect(r.sample.$$[10].$$[5]._).toBe('6')

    expect(r.sample.$$[17]['#name']).toBe('textordertest')
    expect(r.sample.$$[17].$$[0]['#name']).toBe('__text__')
    expect(r.sample.$$[17].$$[0]._).toBe('this is text with ')
    expect(r.sample.$$[17].$$[1]['#name']).toBe('b')
    expect(r.sample.$$[17].$$[1]._).toBe('markup')
    expect(r.sample.$$[17].$$[2]['#name']).toBe('em')
    expect(r.sample.$$[17].$$[2]._).toBe('like this')
    expect(r.sample.$$[17].$$[3]['#name']).toBe('__text__')
    expect(r.sample.$$[17].$$[3]._).toBe(' in the middle')
  }))

  it('test parse with explicitChildren and charsAsChildren and preserveChildrenOrder and includeWhiteChars', skeleton({
    explicitChildren: true,
    preserveChildrenOrder: true,
    charsAsChildren: true,
    includeWhiteChars: true,
  }, (r) => {
    expect(r.sample.$$[35]['#name']).toBe('textordertest')
    expect(r.sample.$$[35].$$[0]['#name']).toBe('__text__')
    expect(r.sample.$$[35].$$[0]._).toBe('this is text with ')
    expect(r.sample.$$[35].$$[1]['#name']).toBe('b')
    expect(r.sample.$$[35].$$[1]._).toBe('markup')
    expect(r.sample.$$[35].$$[2]['#name']).toBe('__text__')
    expect(r.sample.$$[35].$$[2]._).toBe('   ')
    expect(r.sample.$$[35].$$[3]['#name']).toBe('em')
    expect(r.sample.$$[35].$$[3]._).toBe('like this')
    expect(r.sample.$$[35].$$[4]['#name']).toBe('__text__')
    expect(r.sample.$$[35].$$[4]._).toBe(' in the middle')
  }))

  it('test parse with explicitChildren and charsAsChildren and preserveChildrenOrder and includeWhiteChars and normalize', skeleton({
    explicitChildren: true,
    preserveChildrenOrder: true,
    charsAsChildren: true,
    includeWhiteChars: true,
    normalize: true,
  }, (r) => {
    expect(r.sample.$$[35]['#name']).toBe('textordertest')
    expect(r.sample.$$[35].$$[0]['#name']).toBe('__text__')
    expect(r.sample.$$[35].$$[0]._).toBe('this is text with')
    expect(r.sample.$$[35].$$[1]['#name']).toBe('b')
    expect(r.sample.$$[35].$$[1]._).toBe('markup')
    expect(r.sample.$$[35].$$[2]['#name']).toBe('__text__')
    expect(r.sample.$$[35].$$[2]._).toBe('')
    expect(r.sample.$$[35].$$[3]['#name']).toBe('em')
    expect(r.sample.$$[35].$$[3]._).toBe('like this')
    expect(r.sample.$$[35].$$[4]['#name']).toBe('__text__')
    expect(r.sample.$$[35].$$[4]._).toBe('in the middle')
  }))

  it('test element without children', skeleton({ explicitChildren: true }, (r) => {
    expect(r.sample.$$.nochildrentest[0].$$).toBeUndefined()
  }))

  it('test parse with explicitChildren and charsAsChildren', skeleton({
    explicitChildren: true,
    charsAsChildren: true,
  }, (r) => {
    expect(r.sample.$$.chartest[0].$$._).toBe('Character data here!')
    expect(r.sample.$$.cdatatest[0].$$._).toBe('CDATA here!')
    expect(r.sample.$$.listtest[0].$$.item[0].$$._).toBe('\n            This  is\n            \n            character\n            \n            data!\n            \n        ')
    expect(Object.keys(r.sample.$$.tagcasetest[0].$$)).toHaveLength(3)
  }))

  it('test text trimming, normalize', skeleton({ trim: true, normalize: true }, (r) => {
    expect(r.sample.whitespacetest[0]._).toBe('Line One Line Two')
  }))

  it('test text trimming, no normalizing', skeleton({ trim: true, normalize: false }, (r) => {
    expect(r.sample.whitespacetest[0]._).toBe('Line One\n        Line Two')
  }))

  it('test text no trimming, normalize', skeleton({ trim: false, normalize: true }, (r) => {
    expect(r.sample.whitespacetest[0]._).toBe('Line One Line Two')
  }))

  it('test text no trimming, no normalize', skeleton({ trim: false, normalize: false }, (r) => {
    expect(r.sample.whitespacetest[0]._).toBe('\n        Line One\n        Line Two\n    ')
  }))

  it('test enabled root node elimination', skeleton({
    __xmlString: '<root></root>',
    explicitRoot: false,
  }, (r) => {
    expect(r).toBe('')
  }))

  it('test disabled root node elimination', skeleton({
    __xmlString: '<root></root>',
    explicitRoot: true,
  }, (r) => {
    expect(r).toEqual({ root: '' })
  }))

  it('test default empty tag result', skeleton(undefined, (r) => {
    expect(r.sample.emptytest).toEqual([''])
  }))

  it('test empty tag result specified null', skeleton({ emptyTag: null }, (r) => {
    expect(r.sample.emptytest[0]).toBeNull()
  }))

  it('test invalid empty XML file', skeleton({ __xmlString: ' ' }, (r) => {
    expect(r).toBeNull()
  }))

  it('test enabled normalizeTags', skeleton({ normalizeTags: true }, (r) => {
    expect(Object.keys(r.sample.tagcasetest)).toHaveLength(1)
  }))

  it('test parse with custom char and attribute object keys', skeleton({
    attrkey: 'attrobj',
    charkey: 'charobj',
  }, (r) => {
    expect(r.sample.chartest[0].attrobj.desc).toBe('Test for CHARs')
    expect(r.sample.chartest[0].charobj).toBe('Character data here!')
    expect(r.sample.cdatatest[0].attrobj.desc).toBe('Test for CDATA')
    expect(r.sample.cdatatest[0].attrobj.misc).toBe('true')
    expect(r.sample.cdatatest[0].charobj).toBe('CDATA here!')
    expect(r.sample.cdatawhitespacetest[0].charobj).toBe('   ')
    expect(r.sample.nochartest[0].attrobj.desc).toBe('No data')
    expect(r.sample.nochartest[0].attrobj.misc).toBe('false')
  }))

  it('test child node without explicitArray', skeleton({ explicitArray: false }, (r) => {
    expect(r.sample.arraytest.item[0].subitem).toBe('Baz.')
    expect(r.sample.arraytest.item[1].subitem[0]).toBe('Foo.')
    expect(r.sample.arraytest.item[1].subitem[1]).toBe('Bar.')
  }))

  it('test child node with explicitArray', skeleton({ explicitArray: true }, (r) => {
    expect(r.sample.arraytest[0].item[0].subitem[0]).toBe('Baz.')
    expect(r.sample.arraytest[0].item[1].subitem[0]).toBe('Foo.')
    expect(r.sample.arraytest[0].item[1].subitem[1]).toBe('Bar.')
  }))

  it('test ignore attributes', skeleton({ ignoreAttrs: true }, (r) => {
    expect(r.sample.chartest[0]).toBe('Character data here!')
    expect(r.sample.cdatatest[0]).toBe('CDATA here!')
    expect(r.sample.nochartest[0]).toBe('')
    expect(r.sample.listtest[0].item[0]._).toBe('\n            This  is\n            \n            character\n            \n            data!\n            \n        ')
    expect(r.sample.listtest[0].item[0].subitem[0]).toBe('Foo(1)')
    expect(r.sample.listtest[0].item[0].subitem[1]).toBe('Foo(2)')
    expect(r.sample.listtest[0].item[0].subitem[2]).toBe('Foo(3)')
    expect(r.sample.listtest[0].item[0].subitem[3]).toBe('Foo(4)')
    expect(r.sample.listtest[0].item[1]).toBe('Qux.')
    expect(r.sample.listtest[0].item[2]).toBe('Quux.')
  }))

  it('test simple callback mode', () => {
    return new Promise<void>((resolve, _) => {
      const x2js = new Parser()
      fs.readFile(fileName, (err, data) => {
        expect(err).toBeNull()
        x2js.parseString(data, (err, r) => {
          expect(err).toBeNull()
          expect(r.sample.chartest[0]._).toBe('Character data here!')
          resolve()
        })
      })
    })
  })

  it('test simple callback with options', () => {
    return new Promise<void>((resolve) => {
      fs.readFile(fileName, (_, data) => {
        parseString(data, {
          trim: true,
          normalize: true,
        }, (_, r) => {
          expect(r.sample.whitespacetest[0]._).toBe('Line One Line Two')
          resolve()
        })
      })
    })
  })

  it('test double parse', () => {
    return new Promise<void>((resolve, _) => {
      const x2js = new Parser()
      fs.readFile(fileName, (err, data) => {
        expect(err).toBeNull()
        x2js.parseString(data, (err, r) => {
          expect(err).toBeNull()
          expect(r.sample.chartest[0]._).toBe('Character data here!')

          x2js.parseString(data, (err, r) => {
            expect(err).toBeNull()
            expect(r.sample.chartest[0]._).toBe('Character data here!')
            resolve()
          })
        })
      })
    })
  })

  it('test element with garbage XML', () => {
    return new Promise<void>((resolve) => {
      const x2js = new Parser()
      const xmlString = '<<>fdfsdfsdf<><<><??><<><>!<>!<!<>!.'
      x2js.parseString(xmlString, (err, _) => {
        expect(err).not.toBeNull()
        resolve()
      })
    })
  })

  it('test simple function without options', () => {
    return new Promise<void>((resolve) => {
      fs.readFile(fileName, (_, data) => {
        parseString(data, (err, r) => {
          expect(err).toBeNull()
          expect(r.sample.chartest[0]._).toBe('Character data here!')
          resolve()
        })
      })
    })
  })

  it('test simple function with options', () => {
    return new Promise<void>((resolve) => {
      fs.readFile(fileName, (_, data) => {
        // well, {} still counts as option, right?
        parseString(data, {}, (err, r) => {
          expect(err).toBeNull()
          expect(r.sample.chartest[0]._).toBe('Character data here!')
          resolve()
        })
      })
    })
  })

  it('test async execution', () => {
    return new Promise<void>((resolve) => {
      fs.readFile(fileName, (_, data) => {
        parseString(data, { async: true }, (err, r) => {
          expect(err).toBeNull()
          expect(r.sample.chartest[0]._).toBe('Character data here!')
          resolve()
        })
      })
    })
  })

  it('chunkSize less than str length', async () => {
    const parser = new Parser({
      async: true,
      chunkSize: 5,
    })

    const xml = '<root>abcdefghijklmnopqrstuvwxyz</root>'

    await parser.parseStringPromise(xml)
    expect(parser.remaining).toBe('')
  })

  it('test validator', skeleton({ validator }, (r) => {
    expect(typeof r.sample.validatortest[0].stringtest[0]).toBe('string')
    expect(typeof r.sample.validatortest[0].numbertest[0]).toBe('number')
    expect(Array.isArray(r.sample.validatortest[0].emptyarray[0].item)).toBe(true)
    expect(r.sample.validatortest[0].emptyarray[0].item.length).toBe(0)
    expect(Array.isArray(r.sample.validatortest[0].oneitemarray[0].item)).toBe(true)
    expect(r.sample.validatortest[0].oneitemarray[0].item.length).toBe(1)
    expect(r.sample.validatortest[0].oneitemarray[0].item[0]).toBe('Bar.')
    expect(Array.isArray(r.sample.arraytest[0].item)).toBe(true)
    expect(r.sample.arraytest[0].item.length).toBe(2)
    expect(r.sample.arraytest[0].item[0].subitem[0]).toBe('Baz.')
    expect(r.sample.arraytest[0].item[1].subitem[0]).toBe('Foo.')
    expect(r.sample.arraytest[0].item[1].subitem[1]).toBe('Bar.')
  }))

  it('test validation error', () => {
    return new Promise<void>((resolve) => {
      const x2js = new Parser({ validator })
      x2js.parseString('<validationerror/>', (err, _) => {
        expect(err?.message).toBe('Validation error!')
        resolve()
      })
    })
  })

  it('test error throwing', () => {
    const xml = '<?xml version="1.0" encoding="utf-8"?><test>content is ok<test>'
    expect(() => {
      parseString(xml, () => {
        throw new Error('error throwing in callback')
      })
    }).toThrow('error throwing in callback')
  })

  it('test error throwing after an error (async)', () => {
    return new Promise<void>((resolve, reject) => {
      const xml = '<?xml version="1.0" encoding="utf-8"?><test node is not okay>content is ok</test node is not okay>'
      let nCalled = 0

      parseString(xml, { async: true }, () => {
        // Make sure no future changes break this
        ++nCalled
        if (nCalled > 1) {
          reject(new Error('callback called multiple times'))
          return
        }

        // SAX Parser throws multiple errors when processing async. We need to catch and return the first error
        // and then squelch the rest. The only way to test this is to defer the test finish call until after the
        // current stack processes, which, if the test would fail, would contain and throw the additional errors
        setTimeout(resolve, 0)
      })
    })
  })

  it('test xmlns', skeleton({ xmlns: true }, (r) => {
    expect(r.sample['pfx:top'][0].$ns.local).toBe('top')
    expect(r.sample['pfx:top'][0].$ns.uri).toBe('http://foo.com')
    expect(r.sample['pfx:top'][0].$['pfx:attr'].value).toBe('baz')
    expect(r.sample['pfx:top'][0].$['pfx:attr'].local).toBe('attr')
    expect(r.sample['pfx:top'][0].$['pfx:attr'].uri).toBe('http://foo.com')
    expect(r.sample['pfx:top'][0].middle[0].$ns.local).toBe('middle')
    expect(r.sample['pfx:top'][0].middle[0].$ns.uri).toBe('http://bar.com')
  }))

  it('test callback should be called once', () => {
    const xml = '<?xml version="1.0" encoding="utf-8"?><test>test</test>'
    let i = 0
    expect(() => {
      parseString(xml, () => {
        i++
        throw new Error('Custom error message')
      })
    }).toThrow('Custom error message')
    expect(i).toBe(1)
  })

  it('test no error event after end', () => {
    const xml = '<?xml version="1.0" encoding="utf-8"?><test>test</test>'
    let errorCount = 0
    const x2js = new Parser()

    x2js.on('error', () => {
      errorCount++
    })

    x2js.on('end', () => {
      throw new Error('some error in user-land')
    })

    expect(() => {
      x2js.parseString(xml)
    }).toThrow('some error in user-land')

    expect(errorCount).toBe(0)
  })

  it('test empty CDATA', () => {
    return new Promise<void>((resolve) => {
      const xml = '<xml><Label><![CDATA[]]></Label><MsgId>5850440872586764820</MsgId></xml>'
      parseString(xml, (_, parsed) => {
        expect(parsed.xml.Label[0]).toBe('')
        resolve()
      })
    })
  })

  it('test CDATA whitespaces result', () => {
    return new Promise<void>((resolve) => {
      const xml = '<spacecdatatest><![CDATA[ ]]></spacecdatatest>'
      parseString(xml, (_, parsed) => {
        expect(parsed.spacecdatatest).toBe(' ')
        resolve()
      })
    })
  })

  it('test escaped CDATA result', () => {
    return new Promise<void>((resolve) => {
      const xml = '<spacecdatatest><![CDATA[]]]]><![CDATA[>]]></spacecdatatest>'
      parseString(xml, (_, parsed) => {
        expect(parsed.spacecdatatest).toBe(']]>')
        resolve()
      })
    })
  })

  it('test non-strict parsing', () => {
    return new Promise<void>((resolve) => {
      const html = '<html><head></head><body><br></body></html>'
      parseString(html, { strict: false }, (err, _) => {
        expect(err).toBeNull()
        resolve()
      })
    })
  })

  it('test construction with new and without', () => {
    return new Promise<void>((resolve) => {
      const demo = '<xml><foo>Bar</foo></xml>'
      const withNew = new Parser()
      withNew.parseString(demo, (err, resWithNew) => {
        expect(err).toBeNull()

        const withoutNew = new Parser()
        withoutNew.parseString(demo, (err, resWithoutNew) => {
          expect(err).toBeNull()
          expect(resWithNew).toEqual(resWithoutNew)
          resolve()
        })
      })
    })
  })

  it('test not closed but well formed xml', () => {
    return new Promise<void>((resolve) => {
      const xml = '<test>'
      parseString(xml, (err, _) => {
        expect(err?.message).toBe('Unclosed root tag\nLine: 0\nColumn: 6\nChar: ')
        resolve()
      })
    })
  })

  it('test cdata-named node', () => {
    return new Promise<void>((resolve) => {
      const xml = '<test><cdata>hello</cdata></test>'
      parseString(xml, (_, parsed) => {
        expect(parsed.test.cdata[0]).toBe('hello')
        resolve()
      })
    })
  })

  it('test onend with empty xml', () => {
    return new Promise<void>((resolve) => {
      const xml = '<?xml version="1.0"?>'
      parseString(xml, (_, parsed) => {
        expect(parsed).toBeNull()
        resolve()
      })
    })
  })

  it('test parsing null', () => {
    return new Promise<void>((resolve) => {
      const xml = null
      parseString(xml as any, (err, _) => {
        expect(err).not.toBeNull()
        resolve()
      })
    })
  })

  it('test parsing undefined', () => {
    return new Promise<void>((resolve) => {
      const xml = undefined
      parseString(xml as any, (err, _) => {
        expect(err).not.toBeNull()
        resolve()
      })
    })
  })

  it('test chunked processing', () => {
    return new Promise<void>((resolve) => {
      const xml = '<longstuff>abcdefghijklmnopqrstuvwxyz</longstuff>'
      parseString(xml, { chunkSize: 10 }, (err, parsed) => {
        expect(err).toBeNull()
        expect(parsed.longstuff).toBe('abcdefghijklmnopqrstuvwxyz')
        resolve()
      })
    })
  })

  it('test single attrNameProcessors', skeleton({ attrNameProcessors: [nameToUpperCase] }, (r) => {
    expect(r.sample.attrNameProcessTest[0].$).toHaveProperty('CAMELCASEATTR')
    expect(r.sample.attrNameProcessTest[0].$).toHaveProperty('LOWERCASEATTR')
  }))

  it('test multiple attrNameProcessors', skeleton({ attrNameProcessors: [nameToUpperCase, nameCutoff] }, (r) => {
    expect(r.sample.attrNameProcessTest[0].$).toHaveProperty('CAME')
    expect(r.sample.attrNameProcessTest[0].$).toHaveProperty('LOWE')
  }))

  it('test single attrValueProcessors', skeleton({ attrValueProcessors: [nameToUpperCase] }, (r) => {
    expect(r.sample.attrValueProcessTest[0].$.camelCaseAttr).toBe('CAMELCASEATTRVALUE')
    expect(r.sample.attrValueProcessTest[0].$.lowerCaseAttr).toBe('LOWERCASEATTRVALUE')
  }))

  it('test multiple attrValueProcessors', skeleton({ attrValueProcessors: [nameToUpperCase, nameCutoff] }, (r) => {
    expect(r.sample.attrValueProcessTest[0].$.camelCaseAttr).toBe('CAME')
    expect(r.sample.attrValueProcessTest[0].$.lowerCaseAttr).toBe('LOWE')
  }))

  it('test single valueProcessors', skeleton({ valueProcessors: [nameToUpperCase] }, (r) => {
    expect(r.sample.valueProcessTest[0]).toBe('SOME VALUE')
  }))

  it('test multiple valueProcessors', skeleton({ valueProcessors: [nameToUpperCase, nameCutoff] }, (r) => {
    expect(r.sample.valueProcessTest[0]).toBe('SOME')
  }))

  it('test single tagNameProcessors', skeleton({ tagNameProcessors: [nameToUpperCase] }, (r) => {
    expect(r).toHaveProperty('SAMPLE')
    expect(r.SAMPLE).toHaveProperty('TAGNAMEPROCESSTEST')
  }))

  it('test single tagNameProcessors in simple callback', () => {
    return new Promise<void>((resolve) => {
      fs.readFile(fileName, (_, data) => {
        parseString(data, { tagNameProcessors: [nameToUpperCase] }, (_, r) => {
          expect(r).toHaveProperty('SAMPLE')
          expect(r.SAMPLE).toHaveProperty('TAGNAMEPROCESSTEST')
          resolve()
        })
      })
    })
  })

  it('test multiple tagNameProcessors', skeleton({ tagNameProcessors: [nameToUpperCase, nameCutoff] }, (r) => {
    expect(r).toHaveProperty('SAMP')
    expect(r.SAMP).toHaveProperty('TAGN')
  }))

  it('test attrValueProcessors key param', skeleton({ attrValueProcessors: [replaceValueByName] }, (r) => {
    expect(r.sample.attrValueProcessTest[0].$.camelCaseAttr).toBe('camelCaseAttr')
    expect(r.sample.attrValueProcessTest[0].$.lowerCaseAttr).toBe('lowerCaseAttr')
  }))

  it('test valueProcessors key param', skeleton({ valueProcessors: [replaceValueByName] }, (r) => {
    expect(r.sample.valueProcessTest[0]).toBe('valueProcessTest')
  }))

  it('test parseStringPromise parsing', async () => {
    const x2js = new Parser()
    const data = await readFile(fileName)
    const r = await x2js.parseStringPromise(data)
    expect(r.sample.chartest[0]._).toBe('Character data here!')
  })

  it('test parseStringPromise with bad input', async () => {
    const x2js = new Parser()
    await expect(x2js.parseStringPromise('< a moose bit my sister>')).rejects.toBeDefined()
  })

  it('test global parseStringPromise parsing', async () => {
    const data = await readFile(fileName)
    const r = await parseStringPromise(data)
    expect(r).not.toBeNull()
    expect(r.sample.listtest[0].item[0].subitem[0]).toBe('Foo(1)')
  })

  it('test global parseStringPromise with options', async () => {
    const data = await readFile(fileName)
    const r = await parseStringPromise(data, {
      trim: true,
      normalize: true,
    })
    expect(r).not.toBeNull()
    expect(r.sample.whitespacetest[0]._).toBe('Line One Line Two')
  })

  it('test global parseStringPromise with bad input', async () => {
    await expect(parseStringPromise('< a moose bit my sister>')).rejects.toBeDefined()
  })
})
