const { Modal, Notice, Plugin, Setting, normalizePath } = require("obsidian");

const OVERVIEW_TEMPLATE_PATH = "模板/主题地图模板.md";
const QUESTION_TEMPLATE_PATH = "模板/问题驱动费曼笔记模板.md";

module.exports = class LearningTopicCreatorPlugin extends Plugin {
  async onload() {
    this.addRibbonIcon("folder-plus", "新建学习主题", () => {
      new LearningTopicModal(this.app).open();
    });

    this.addCommand({
      id: "create-learning-topic",
      name: "新建学习主题",
      callback: () => {
        new LearningTopicModal(this.app).open();
      },
    });

    this.addCommand({
      id: "create-question-note",
      name: "新建问题驱动笔记",
      callback: () => {
        new QuestionNoteModal(this.app).open();
      },
    });
  }
};

class LearningTopicModal extends Modal {
  constructor(app) {
    super(app);
    this.category = "";
    this.topic = "";
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("learning-topic-modal");

    contentEl.createEl("h2", { text: "新建学习主题" });
    contentEl.createEl("p", {
      text: "创建一个问题驱动费曼学习主题包：总览、问题、原子笔记、实践记录、资源、归档。",
    });

    addTextSetting(contentEl, "分类", "例如: 网络、Android、Agent", "网络", (value) => {
      this.category = value;
    }, (event) => this.submitOnEnter(event));

    addTextSetting(contentEl, "主题", "例如: HTTP、TCP、Handler", "HTTP", (value) => {
      this.topic = value;
    }, (event) => this.submitOnEnter(event), true);

    new Setting(contentEl)
      .addButton((button) => {
        button
          .setButtonText("创建")
          .setCta()
          .onClick(() => this.createTopic());
      })
      .addButton((button) => {
        button
          .setButtonText("取消")
          .onClick(() => this.close());
      });
  }

  onClose() {
    this.contentEl.empty();
  }

  submitOnEnter(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      this.createTopic();
    }
  }

  async createTopic() {
    const category = sanitizePathPart(this.category);
    const topic = sanitizePathPart(this.topic);

    if (!category || !topic) {
      new Notice("请填写分类和主题");
      return;
    }

    try {
      const paths = await createTopicPackage(this.app, category, topic);
      const file = this.app.vault.getAbstractFileByPath(paths.overviewPath);
      if (file) {
        await this.app.workspace.getLeaf(false).openFile(file);
      }

      new Notice(`已创建学习主题: ${category}/${topic}`);
      this.close();
    } catch (error) {
      console.error(error);
      new Notice(`创建失败: ${error.message ?? error}`);
    }
  }
}

class QuestionNoteModal extends Modal {
  constructor(app) {
    super(app);
    this.category = "";
    this.topic = "";
    this.question = "";
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("learning-topic-modal");

    contentEl.createEl("h2", { text: "新建问题驱动笔记" });
    contentEl.createEl("p", {
      text: "从一个真实问题开始，用费曼法完成：先解释、找卡点、补知识、再解释、实践验证。",
    });

    addTextSetting(contentEl, "分类", "例如: 网络、Android、Agent", "网络", (value) => {
      this.category = value;
    }, (event) => this.submitOnEnter(event));

    addTextSetting(contentEl, "主题", "例如: HTTP、TCP、Handler", "HTTP", (value) => {
      this.topic = value;
    }, (event) => this.submitOnEnter(event));

    addTextSetting(contentEl, "问题", "例如: 为什么登录接口返回 401？", "为什么登录接口返回 401？", (value) => {
      this.question = value;
    }, (event) => this.submitOnEnter(event), true);

    new Setting(contentEl)
      .addButton((button) => {
        button
          .setButtonText("创建")
          .setCta()
          .onClick(() => this.createQuestionNote());
      })
      .addButton((button) => {
        button
          .setButtonText("取消")
          .onClick(() => this.close());
      });
  }

  onClose() {
    this.contentEl.empty();
  }

  submitOnEnter(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      this.createQuestionNote();
    }
  }

  async createQuestionNote() {
    const category = sanitizePathPart(this.category);
    const topic = sanitizePathPart(this.topic);
    const question = this.question.trim();
    const questionFileName = sanitizePathPart(question);

    if (!category || !topic || !question || !questionFileName) {
      new Notice("请填写分类、主题和问题");
      return;
    }

    try {
      const paths = await createTopicPackage(this.app, category, topic);
      const questionPath = normalizePath(`${paths.topicRoot}/问题/${questionFileName}.md`);

      if (!(await this.app.vault.adapter.exists(questionPath))) {
        const content = await buildQuestionContent(this.app, topic, question);
        await this.app.vault.create(questionPath, content);
      }

      const file = this.app.vault.getAbstractFileByPath(questionPath);
      if (file) {
        await this.app.workspace.getLeaf(false).openFile(file);
      }

      new Notice(`已创建问题笔记: ${question}`);
      this.close();
    } catch (error) {
      console.error(error);
      new Notice(`创建失败: ${error.message ?? error}`);
    }
  }
}

function addTextSetting(contentEl, name, desc, placeholder, onChange, onEnter, focus = false) {
  new Setting(contentEl)
    .setName(name)
    .setDesc(desc)
    .addText((text) => {
      text.setPlaceholder(placeholder).onChange(onChange);
      text.inputEl.addEventListener("keydown", onEnter);
      if (focus) {
        window.setTimeout(() => text.inputEl.focus(), 50);
      }
    });
}

async function createTopicPackage(app, category, topic) {
  const topicRoot = normalizePath(`学习/${category}/${topic}`);
  const overviewPath = normalizePath(`${topicRoot}/${topic} 总览.md`);

  await ensureFolder(app, topicRoot);
  await ensureFolder(app, `${topicRoot}/问题`);
  await ensureFolder(app, `${topicRoot}/原子笔记`);
  await ensureFolder(app, `${topicRoot}/实践记录`);
  await ensureFolder(app, `${topicRoot}/资源`);
  await ensureFolder(app, `${topicRoot}/归档`);

  if (!(await app.vault.adapter.exists(overviewPath))) {
    const content = await buildOverviewContent(app, topic);
    await app.vault.create(overviewPath, content);
  }

  return { topicRoot, overviewPath };
}

async function ensureFolder(app, folderPath) {
  const normalized = normalizePath(folderPath);
  if (await app.vault.adapter.exists(normalized)) {
    return;
  }

  const parts = normalized.split("/");
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (!(await app.vault.adapter.exists(current))) {
      await app.vault.createFolder(current);
    }
  }
}

async function buildOverviewContent(app, topic) {
  const content = await readTemplate(app, OVERVIEW_TEMPLATE_PATH, fallbackOverviewTemplate());
  return hydrateTemplate(content, {
    title: `${topic} 总览`,
    topic,
  });
}

async function buildQuestionContent(app, topic, question) {
  const content = await readTemplate(app, QUESTION_TEMPLATE_PATH, fallbackQuestionTemplate());
  return hydrateTemplate(content, {
    title: question,
    topic,
    question,
  });
}

async function readTemplate(app, path, fallback) {
  if (await app.vault.adapter.exists(path)) {
    return app.vault.adapter.read(path);
  }
  return fallback;
}

function hydrateTemplate(content, values) {
  const today = new Date().toISOString().slice(0, 10);
  return content
    .replaceAll("{{title}}", values.title)
    .replaceAll("{{topic}}", values.topic)
    .replaceAll("{{question}}", values.question ?? "")
    .replaceAll("{{date:YYYY-MM-DD}}", today)
    .replace(/^主题:\s*$/m, `主题: ${values.topic}`)
    .replace(/^问题:\s*$/m, values.question ? `问题: ${values.question}` : "问题:")
    .replace(/^# .*/m, `# ${values.title}`);
}

function sanitizePathPart(value) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ");
}

function fallbackOverviewTemplate() {
  return `---
类型: 主题地图
主题:
状态: 维护中
创建日期: "{{date:YYYY-MM-DD}}"
tags:
  - moc
---

# {{title}}

## 一句话模型


## 核心问题

- [ ] 
- [ ] 
- [ ] 

## 问题网络

| 问题 | 会牵出的知识点 | 对应笔记 | 实践验证 |
| --- | --- | --- | --- |
|  |  |  |  |

## 主干流程

\`\`\`text

\`\`\`
`;
}

function fallbackQuestionTemplate() {
  return `---
类型: 问题笔记
主题: {{topic}}
问题: {{question}}
状态: 探索中
创建日期: "{{date:YYYY-MM-DD}}"
tags:
  - question-driven
  - feynman
---

# {{title}}

## 真实问题

{{question}}

## 先用自己的话解释

> 我的第一版解释:


## 我卡在哪里

- [ ] 
- [ ] 
- [ ] 

## 需要补的知识点

- 
- 
- 

## 查证和修正

| 卡点 | 查到的信息 | 我现在怎么理解 |
| --- | --- | --- |
|  |  |  |

## 再讲一遍

> 我的第二版解释:


## 实践验证

- 验证方式:
- 观察结果:
- 结论:

## 沉淀关系

- 主题地图:
- 相关原子笔记:
- 相关实践记录:
- 后续问题:

## 最终答案

`;
}
