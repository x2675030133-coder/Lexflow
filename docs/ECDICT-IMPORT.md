# ECDICT 词库导入指南

本项目使用开源的 ECDICT 词库数据，避免了爬虫和版权问题。

## 数据来源

- **项目**: [ECDICT](https://github.com/skywind3000/ECDICT) by skywind3000
- **许可**: MIT License
- **词条数量**: 77万+ 英汉词条
- **特色**: 包含考试标签（中考、高考、四六级、雅思、托福、GRE）

## 使用步骤

### 1. 下载 ECDICT 数据

访问 [ECDICT Releases](https://github.com/skywind3000/ECDICT/releases) 下载 `stardict.csv` 文件。

或使用命令行：

```bash
# 创建数据目录
mkdir -p scripts/data

# 下载 CSV 文件（约 200MB）
curl -L https://github.com/skywind3000/ECDICT/releases/download/1.0.28/ecdict-sqlite-28.zip -o scripts/data/ecdict.zip
unzip scripts/data/ecdict.zip -d scripts/data/
```

### 2. 运行导入脚本

```bash
node scripts/import-ecdict.js
```

脚本会自动：
- 读取 `stardict.csv`
- 按标签过滤词汇（zk, gk, cet4, cet6, ielts, toefl, gre）
- 转换为应用所需的 JSON 格式
- 输出到 `public/data/` 目录

### 3. 标签映射

| ECDICT 标签 | 应用词表 | 说明 |
|------------|---------|------|
| zk | junior.json | 中考词汇 |
| gk | senior.json | 高考词汇 |
| cet4 | cet4.json | 大学英语四级 |
| cet6 | cet6.json | 大学英语六级 |
| ielts | ielts.json | 雅思 |
| toefl | toefl.json | 托福 |
| gre | gre.json | GRE |

**注意**: `primary.json`（小学词汇）需要手动维护，ECDICT 中没有对应标签。

## 数据格式

ECDICT 原始格式：
```csv
word,phonetic,definition,translation,pos,collins,oxford,tag,bnc,frq,exchange
abandon,/ə'bændən/,to give up completely,放弃；抛弃,v:100,5,1,cet4 cet6 ielts toefl gre,3,4,d:abandoned/p:abandoned/i:abandoning/3:abandons
```

转换后的应用格式：
```json
{
  "id": "cet4-001",
  "word": "abandon",
  "phonetic": "/ə'bændən/",
  "partOfSpeech": ["v."],
  "definitions": [
    {"en": "to give up completely", "zh": "放弃；抛弃"}
  ],
  "examples": [
    {"en": "I need to learn the word \"abandon\".", "zh": "我需要学习单词\"abandon\"。"}
  ],
  "imageQuery": "abandon to give up completely",
  "memoryTip": "abandon - 放弃；抛弃"
}
```

## 优势

✅ **合法合规**: MIT 开源许可，可商用  
✅ **数据质量高**: 社区维护，持续更新  
✅ **标签完整**: 覆盖所有主流英语考试  
✅ **音标准确**: 包含 IPA 国际音标  
✅ **词频数据**: 可按使用频率排序  

## 参考资料

- [ECDICT 项目主页](https://github.com/skywind3000/ECDICT)
- [ECDICT 数据格式说明](https://github.com/skywind3000/ECDICT/blob/master/README.md)
- [其他开源词库推荐](https://github.com/topics/english-vocabulary)

---

**Sources:**
- [ECDICT GitHub Repository](https://github.com/skywind3000/ECDICT)
- [ECDICT-ultimate Releases](https://github.com/skywind3000/ECDICT-ultimate/releases)
