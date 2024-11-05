**多栏**，用单栏拼接。

**预渲染**，如果遇到某个章节特别大，每一章加载的时间就会特别长，所以有两个方案，一个是现将所有的东西渲染好，保存到磁盘上或者内存中，然后再提供给用户，第二个是针对章节的页做一个基于双向链表的管理器。

**基于双向链表的页管理器**，首先原本往svg上添加内容是按照段落添加的，所以这里我可以将整个过程拆分，类似react的做法，在加载完一页之后就挂到链表上面，然后在链表上设置最大值，超过这个值的时候进行垃圾回收。

**笔记功能**，支持划线，这个功能的实现主要是为每一个字符都分配一个id，在划线的时候获取对应的dom元素，存储相应的id，在重新加载的时候读取这些id，通过svg的filter标签给字体添加背景等特效。

**代码块复制换行**，在选中svg text标签的文本复制的时候，会在每一个字符后面都有一个换行符，因此对代码块来讲，就无法保留原始代码块的换行信息，这里我做的处理是在渲染行结束的时候，在新增一个带有特殊符号的text标签，然后将其长宽置为0，在复制之后，拿到文本时先将换行符替换为空，然后将特殊字符替换为换行就可以保留原始代码的信息。

**倒序渲染**，先对段落进行分行，确保每行的长度不超过给定长度，然后按行倒序逐行渲染。为了支持笔记功能和语音跟读功能，不管是正序渲染还是倒序渲染，相同位置的字符都需要分配相同的id。现在的id组成为：`[chapterId]-[contentIndex]-[charIndex]`

**语音跟读功能**：

```javascript
const timestamps = [
  { start: 0.0, end: 0.5, rangeStart: 1, rangeEnd: 5 }, // 高亮 "Hello"
  { start: 0.5, end: 1.0, rangeStart: 7, rangeEnd: 11 }, // 高亮 "this"
  { start: 1.0, end: 1.5, rangeStart: 13, rangeEnd: 15 }, // 高亮 "is"
  { start: 1.5, end: 2.0, rangeStart: 17, rangeEnd: 17 }, // 高亮 "a"
  { start: 2.0, end: 2.5, rangeStart: 19, rangeEnd: 22 } // 高亮 "test"
]
```

可以先从对应的音频中提取出以上的数据结构，在浏览器端audio有一个timepdate事件，该事件触发的时候能够获取到播放的时间，之后可以从表中查找出需要高亮的字，通过svg的filter标签进行高亮。

对应的代码：

```html
<defs>
    <filter id="text-bg-filter" x="0" y="0" width="100%" height="100%">
        <!-- 创建浅蓝色背景 -->
        <feFlood flood-color="lightblue" result="bg" />
        <feComposite in="bg" in2="SourceGraphic" operator="out" result="bgCom"/>
        <!-- 混合背景和文本 -->
        <feMerge>
            <feMergeNode in="bg" /> <!-- 背景 -->
            <feMergeNode in="SourceGraphic" /> <!-- 原始文本 -->
        </feMerge>
    </filter>
</defs>
```
