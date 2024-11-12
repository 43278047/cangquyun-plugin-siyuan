import { Plugin, Setting, showMessage } from "siyuan";
import "../src/index.scss";

const STORAGE_NAME = "plugin-config";

interface MyPluginSettings {
    apiKey: string;
    syncOnOpen: boolean;
    syncFrequency: string;
    defaultDirectory: string;
    syncTime: string;
    template: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    apiKey: "",
    syncOnOpen: false,
    syncFrequency: "0",
    defaultDirectory: "cangquyun",
    syncTime: "2024-10-01 00:00:00",
    template: `---
标题: {{ title }}
URL: {{ url }}
创建时间: {{ createTime }}
更新时间: {{ updateTime }}
---
{% if highlightList.length > 0 %}
## 划线列表
{% for item in highlightList %}
>{{ item.annotationContent }}^{{ item.highlightId }}
{% if item.noteContent %}

{{ item.noteContent }}
{% endif %}
{% endfor %}
{% endif %}

{% if markdownContent %}
## 全文剪藏
{{ markdownContent }}
{% endif %}
`,
};

export default class CangQuYunPlugin extends Plugin {
    settings: MyPluginSettings;
    private syncIntervalId: number | null = null;
    private syncInProgress = false;

    async onload() {
        console.log("Plugin loaded");
        await this.loadSettings();
        this.initSetting();

        if (this.settings.syncOnOpen) {
            this.syncData();
        }

        this.startSyncInterval();
    }

    onunload() {
        console.log("Plugin unloaded");
        this.stopSyncInterval();
    }

    private startSyncInterval() {
        this.stopSyncInterval(); // 确保之前的定时任务被清除

        const syncFrequency = parseInt(this.settings.syncFrequency, 10);
        if (syncFrequency > 0) {
            this.syncIntervalId = window.setInterval(() => {
                this.syncData();
            }, syncFrequency * 60 * 1000); // 将分钟转换为毫秒
        }
    }

    private stopSyncInterval() {
        if (this.syncIntervalId !== null) {
            clearInterval(this.syncIntervalId);
            this.syncIntervalId = null;
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData(STORAGE_NAME));
    }

    async saveSettings() {
        await this.saveData(STORAGE_NAME, this.settings);
    }

    async updateSyncFrequency(syncFrequency: string) {
        const newSyncFrequency = syncFrequency;
        const oldSyncFrequency = this.settings.syncFrequency;
        this.settings.syncFrequency = newSyncFrequency;
        await this.saveSettings();

        // 只有在 syncFrequency 发生变化时才重新启动定时任务
        if (oldSyncFrequency !== newSyncFrequency) {
            this.startSyncInterval();
        }
    }

    async syncData() {
        if (this.syncInProgress) {
            showMessage("藏趣云同步任务正在进行中，请稍后再试!");
            return;
        }

        this.syncInProgress = true;

        try {
            const apiKey = this.settings.apiKey;
            if (!apiKey) {
                showMessage("API KEY 未设置");
                return;
            }

            // 这里调用你的同步函数
            // await syncBookmarkData(this.app, this);
        } finally {
            this.syncInProgress = false;
        }
    }

    private initSetting() {
        const setting = new Setting({
            confirmCallback: async () => {
                await this.saveSettings();
                showMessage("Settings saved");
            }
        });

        setting.addItem({
            title: "API KEY",
            description: "请在藏趣云网页端的设置页面里，生成Token 填到此处，<a href='https://www.cangquyun.com/openApi?sqType=USER&libraryId=0' target='_blank'>前往生成Token</a>",
            createActionElement: () => {
                const inputElement = document.createElement("input");
                inputElement.className = "b3-text-field fn__block";
                inputElement.placeholder = "Token";
                inputElement.value = this.settings.apiKey;
                inputElement.addEventListener("input", (event) => {
                    this.settings.apiKey = (event.target as HTMLInputElement).value;
                });
                return inputElement;
            },
        });

        setting.addItem({
            title: "打开客户端是否同步",
            description: "打开客户端就触发文章同步任务",
            createActionElement: () => {
                const toggleElement = document.createElement("input");
                toggleElement.type = "checkbox";
                toggleElement.checked = this.settings.syncOnOpen;
                toggleElement.addEventListener("change", (event) => {
                    this.settings.syncOnOpen = (event.target as HTMLInputElement).checked;
                });
                return toggleElement;
            },
        });

        setting.addItem({
            title: "手动同步",
            description: "手动触发同步一次，同步范围是上次同步时间之后的所有数据，如果你需要同步全量的数据，把上次同步时间置空即可",
            createActionElement: () => {
                const buttonElement = document.createElement("button");
                buttonElement.className = "b3-button b3-button--outline fn__flex-center fn__size200";
                buttonElement.textContent = "同步一次";
                buttonElement.addEventListener("click", () => {
                    this.syncData();
                });
                return buttonElement;
            },
        });

        setting.addItem({
            title: "上次同步时间",
            description: "每次同步，只会同步此时间之后的文章数据，如果为空则会同步全量的数据",
            createActionElement: () => {
                const inputElement = document.createElement("input");
                inputElement.className = "b3-text-field fn__block";
                inputElement.placeholder = "";
                inputElement.value = this.settings.syncTime;
                inputElement.addEventListener("input", (event) => {
                    this.settings.syncTime = (event.target as HTMLInputElement).value;
                });
                return inputElement;
            },
        });

        setting.addItem({
            title: "定时同步",
            description: "设置同步频率，在客户端打开的时候，定时去同步文章数据",
            createActionElement: () => {
                const dropdownElement = document.createElement("select");
                dropdownElement.className = "b3-select fn__block";
                const options = [
                    { value: "0", label: "关闭" },
                    { value: "5", label: "5分钟" },
                    { value: "15", label: "15分钟" },
                    { value: "30", label: "30分钟" },
                    { value: "60", label: "60分钟" },
                ];
                options.forEach(option => {
                    const optionElement = document.createElement("option");
                    optionElement.value = option.value;
                    optionElement.textContent = option.label;
                    dropdownElement.appendChild(optionElement);
                });
                dropdownElement.value = this.settings.syncFrequency;
                dropdownElement.addEventListener("change", (event) => {
                    this.updateSyncFrequency((event.target as HTMLSelectElement).value);
                });
                return dropdownElement;
            },
        });

        setting.addItem({
            title: "同步文章根目录",
            description: "同步文章的根目录，所有的数据都会存在这个目录下面",
            createActionElement: () => {
                const inputElement = document.createElement("input");
                inputElement.className = "b3-text-field fn__block";
                inputElement.placeholder = "默认目录cangquyun";
                inputElement.value = this.settings.defaultDirectory;
                inputElement.addEventListener("input", (event) => {
                    this.settings.defaultDirectory = (event.target as HTMLInputElement).value;
                });
                return inputElement;
            },
        });

        setting.addItem({
            title: "文章模板",
            description: "如果要使用自定义文章模板，可以根据教程自己配置 <a href='https://doc.cangquyun.com' target='_blank'>查看模板配置教程</a>",
            createActionElement: () => {
                const textareaElement = document.createElement("textarea");
                textareaElement.className = "b3-text-field fn__block";
                textareaElement.placeholder = "";
                textareaElement.value = this.settings.template;
                textareaElement.addEventListener("input", (event) => {
                    this.settings.template = (event.target as HTMLTextAreaElement).value;
                });
                return textareaElement;
            },
        });
    }
}