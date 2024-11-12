import {
    Plugin,
    showMessage,
    confirm,
    Dialog,
    Menu,
    openTab,
    adaptHotkey,
    getFrontend,
    getBackend,
    Setting,
    fetchPost,
    Protyle,
    openWindow,
    IOperation,
    Constants,
    openMobileFileById,
    lockScreen,
    ICard,
    ICardData,
    Custom, exitSiYuan, getModelByDockType, getAllEditor, Files, platformUtils
} from "siyuan";
import "./index.scss";

const STORAGE_NAME = "menu-config";
const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";

export default class PluginSample extends Plugin {

    private custom: () => Custom;
    private isMobile: boolean;

    onload() {
        this.data[STORAGE_NAME] = { interval: "0",syncOnOpen:"0",apiKey:"",syncTime:""}; // 添加 interval 字段

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
//         // 图标的制作参见帮助文档
//         this.addIcons(`<symbol id="iconFace" viewBox="0 0 32 32">
// <path d="M13.667 17.333c0 0.92-0.747 1.667-1.667 1.667s-1.667-0.747-1.667-1.667 0.747-1.667 1.667-1.667 1.667 0.747 1.667 1.667zM20 15.667c-0.92 0-1.667 0.747-1.667 1.667s0.747 1.667 1.667 1.667 1.667-0.747 1.667-1.667-0.747-1.667-1.667-1.667zM29.333 16c0 7.36-5.973 13.333-13.333 13.333s-13.333-5.973-13.333-13.333 5.973-13.333 13.333-13.333 13.333 5.973 13.333 13.333zM14.213 5.493c1.867 3.093 5.253 5.173 9.12 5.173 0.613 0 1.213-0.067 1.787-0.16-1.867-3.093-5.253-5.173-9.12-5.173-0.613 0-1.213 0.067-1.787 0.16zM5.893 12.627c2.28-1.293 4.040-3.4 4.88-5.92-2.28 1.293-4.040 3.4-4.88 5.92zM26.667 16c0-1.040-0.16-2.040-0.44-2.987-0.933 0.2-1.893 0.32-2.893 0.32-4.173 0-7.893-1.92-10.347-4.92-1.4 3.413-4.187 6.093-7.653 7.4 0.013 0.053 0 0.12 0 0.187 0 5.88 4.787 10.667 10.667 10.667s10.667-4.787 10.667-10.667z"></path>
// </symbol>
// <symbol id="iconSaving" viewBox="0 0 32 32">
// <path d="M20 13.333c0-0.733 0.6-1.333 1.333-1.333s1.333 0.6 1.333 1.333c0 0.733-0.6 1.333-1.333 1.333s-1.333-0.6-1.333-1.333zM10.667 12h6.667v-2.667h-6.667v2.667zM29.333 10v9.293l-3.76 1.253-2.24 7.453h-7.333v-2.667h-2.667v2.667h-7.333c0 0-3.333-11.28-3.333-15.333s3.28-7.333 7.333-7.333h6.667c1.213-1.613 3.147-2.667 5.333-2.667 1.107 0 2 0.893 2 2 0 0.28-0.053 0.533-0.16 0.773-0.187 0.453-0.347 0.973-0.427 1.533l3.027 3.027h2.893zM26.667 12.667h-1.333l-4.667-4.667c0-0.867 0.12-1.72 0.347-2.547-1.293 0.333-2.347 1.293-2.787 2.547h-8.227c-2.573 0-4.667 2.093-4.667 4.667 0 2.507 1.627 8.867 2.68 12.667h2.653v-2.667h8v2.667h2.68l2.067-6.867 3.253-1.093v-4.707z"></path>
// </symbol>`);

//         const statusIconTemp = document.createElement("template");
//         statusIconTemp.innerHTML = `<div class="toolbar__item ariaLabel" aria-label="Remove plugin-sample Data">
//     <svg>
//         <use xlink:href="#iconTrashcan"></use>
//     </svg>
// </div>`;
//         statusIconTemp.content.firstElementChild.addEventListener("click", () => {
//             confirm("⚠️", this.i18n.confirmRemove.replace("${name}", this.name), () => {
//                 this.removeData(STORAGE_NAME).then(() => {
//                     this.data[STORAGE_NAME] = {apiKey: "Readonly", interval: "0"}; // 添加 interval 字段
//                     showMessage(`[${this.name}]: ${this.i18n.removedData}`);
//                 });
//             });
//         });
//
//         this.addStatusBar({
//             element: statusIconTemp.content.firstElementChild as HTMLElement,
//         });

        const textareaElement = document.createElement("textarea");
        this.setting = new Setting({
            confirmCallback: () => {
                this.saveData(STORAGE_NAME, {apiKey: textareaElement.value, interval: selectElement.value}); // 保存 interval 字段
            }
        });
        this.setting.addItem({
            title: "API KEY",
            description: "请在藏趣云网页端的设置页面里，生成Token 填到此处，<a target='_blank' href='https://www.cangquyun.com/openApi?sqType=USER&libraryId=0'>前往生成Token</a>",
            createActionElement: () => {
                const inputElement = document.createElement("input");
                inputElement.type = "text";
                inputElement.className = "b3-text-field fn__block custom-input";
                inputElement.placeholder = "Readonly text in the menu";
                inputElement.value = this.data[STORAGE_NAME].apiKey;
                return inputElement;
            },
        });


        this.setting.addItem({
            title: "上次同步时间",
            description: "每次同步，只会同步此时间之后的文章数据，如果为空则会同步全量的数据",
            createActionElement: () => {
                const inputElement = document.createElement("input");
                inputElement.type = "text";
                inputElement.className = "b3-text-field fn__block custom-input";
                inputElement.placeholder = "Readonly text in the menu";
                inputElement.value = this.data[STORAGE_NAME].syncTime;
                return inputElement;
            },
        });


        const selectElementSync = document.createElement("select");
        selectElementSync.className = "b3-select fn__size200";
        const syncOptions = [
            { value: "0", text: "关闭" },
            { value: "1", text: "开启" },
        ];
        syncOptions.forEach(option => {
            const optionElement = document.createElement("option");
            optionElement.value = option.value;
            optionElement.text = option.text;
            selectElementSync.appendChild(optionElement);
        });
        selectElementSync.value = this.data[STORAGE_NAME].syncOnOpen ; // 设置默认值


        this.setting.addItem({
            title: "打开客户端是否同步",
            description: "打开客户端时是否触发文章同步任务",
            createActionElement: () => selectElementSync
        });


        const selectElement = document.createElement("select");
        selectElement.className = "b3-select fn__size200";
        const options = [
            { value: "0", text: "关闭" },
            { value: "1", text: "1分钟" },
            { value: "5", text: "5分钟" },
            { value: "15", text: "15分钟" }
        ];
        options.forEach(option => {
            const optionElement = document.createElement("option");
            optionElement.value = option.value;
            optionElement.text = option.text;
            selectElement.appendChild(optionElement);
        });
        selectElement.value = this.data[STORAGE_NAME].interval; // 设置默认值

        this.setting.addItem({
            title: "自动保存间隔",
            description: "选择自动保存的时间间隔",
            createActionElement: () => selectElement,
        });

        const syncTask = document.createElement("button");
        syncTask.className = "b3-button b3-button--outline fn__flex-center fn__size200";
        syncTask.textContent = "同步一次";
        syncTask.addEventListener("click", () => {
            showMessage("藏趣云同步任务正在进行中，请稍后再试!");
        });

        this.setting.addItem({
            title: "同步一次",
            description: "同步一次~",
            createActionElement: () => syncTask,
        });

        const btnaElement = document.createElement("button");
        btnaElement.className = "b3-button b3-button--outline fn__flex-center fn__size200";
        btnaElement.textContent = "Open";
        btnaElement.addEventListener("click", () => {
            window.open("https://github.com/siyuan-note/plugin-sample");
        });
        this.setting.addItem({
            title: "Open plugin url",
            description: "Open plugin url in browser",
            actionElement: btnaElement,
        });

        console.log(this.i18n.helloPlugin);
    }

    onLayoutReady() {
        this.loadData(STORAGE_NAME);
        console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
    }

    onunload() {
        console.log(this.i18n.byePlugin);
    }

    uninstall() {
        console.log("uninstall");
    }
}