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
import {config} from "./config";
import {syncBookmarkData} from "./background";

const STORAGE_NAME = config.STORAGE_NAME;


export default class CangQuYunPlugin extends Plugin {

    private custom: () => Custom;
    private isMobile: boolean;
    private syncIntervalId: number | null = null;
    private syncInProgress: boolean = false;

    onload() {
        console.log("onload init start data ",JSON.stringify(this.data[STORAGE_NAME]));
        this.data[STORAGE_NAME] = {syncOnOpen: "1",syncFrequency:"0", apiKey: "", syncTime: "2024-10-01 00:00:00"};
        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

        // 添加自定义图标
        // 添加自定义图标
        this.addIcons(`
    <symbol id="iconSync" viewBox="0 0 32 32">
        <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="32px" height="32px" viewBox="0 0 32 32" enable-background="new 0 0 32 32" xml:space="preserve">  <image id="image0" width="32" height="32" x="0" y="0"
    xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAQtQTFRFAAAAKLX2Kbb2Kbb2Kbb2Kbb2Kbb2Kbb2Kbb2Kbb2Kbb2Kbb2Kbb2Kbb2Kbb2Kbb2Kbb2Kbb2Kbb2Kbb2Kbb2Krb2Kbb2Kbb2Krf3Kbb2Kbb2Kbb2Kbb2Kbb2G6zwDqPqCJ7nBZzmBZzmBJzlBp3mKbb2JLL0CqDoA5vlA5vlBJzlKbb2J7X1B57nA5vlBJzlE6bsA5vlBZzmKbb2JrT1BJzlKbb2GarvBJvlBJzlKa7/Kbb2KLX2DKLpA5vlGqruL7r3D6TrA5vlIbDzBJvlKbb2EaXsBJzmKbb2Kbb2A5vlBZ3mBZ3mBJzmKbb2Kbb2A5vlBZzlKbb2Kbb2Kbb2A5vlBJvlBJzmBp3maA5sGwAAAFl0Uk5TAAFeueb8+uKyUQE72f/NKFr380AmAdjEAWA9JJ7y/////+SYGnT////zXv7///5Y//Qaov974P//0wD7///7AAD/+v/Jkv9sFe/pD/88Su7oPBNwyffFaQ4ZasefAAABCklEQVR4nGNkIAAYh5oCRjj4hlUBNyMjXOVHLAoEGP/A2ayMbzEUcLMh5IEqmN6gKRBl/I7iNi7GF6gKJL+guZ73GbICaUbGD0iSghC/3IErUH2DbL8k1DeMjNegClTZHiHJyzP+hrLYGC+CFYj8RdbPoPwDzuRkPAdSYHwLWV79528Eh/c0SIHZdYSI1gdBFNceByqwYrwE4+szvkb1qxjjQUYGh2PsML7Jc1R5Bql9ICt4YIFl9hRNnkFmD0iB6wko1/IRugL5nSAFHoxHoAaipx4lxq3ggOL8wwHm299BcyL/ZmhQ+zHuA1HaH1DkNRjXM8AiK4iRce8fFAW6wMhawcAw+PIFeQoAgtQ1IaGuddYAAAAASUVORK5CYII=" />
</svg>
    </symbol>
`);
        this.addTopBar({
            icon:  "iconSync",
            title: '触发同步任务',
            position: "left",
            callback: async () => {
                this.syncData();
            }
        })


        // 保存按钮触发
        this.setting = new Setting({
            confirmCallback: () => {
                // showMessage(JSON.stringify({apiKey: inputElement.value,syncFrequency:selectTimeElement.value, syncTime: inputElementTime.value, syncOnOpen: selectElementSync.value}));
                this.saveData(STORAGE_NAME, {apiKey: inputElement.value,syncFrequency:selectTimeElement.value, syncTime: inputElementTime.value, syncOnOpen: selectElementSync.value});
                this.startSyncInterval();
            }
        });

        // apiKey
        const inputElement = document.createElement("input");
        this.setting.addItem({
            title: "API KEY",
            description: "请在藏趣云网页端的设置页面里，生成Token 填到此处，<a target='_blank' href='https://www.cangquyun.com/openApi?sqType=USER&libraryId=0'>前往生成Token</a>",
            createActionElement: () => {
                inputElement.type = "text";
                inputElement.className = "b3-text-field fn__block custom-input";
                inputElement.placeholder = "Readonly text in the menu";
                inputElement.value = this.data[STORAGE_NAME].apiKey;
                return inputElement;
            },
        });
        // 上次同步时间
        const inputElementTime = document.createElement("input");
        this.setting.addItem({
            title: "上次同步时间",
            description: "每次同步，只会同步此时间之后的文章数据，如果为空则会同步全量的数据",
            createActionElement: () => {
                inputElementTime.type = "text";
                inputElementTime.className = "b3-text-field fn__block custom-input";
                inputElementTime.placeholder = "Readonly text in the menu";
                inputElementTime.value = this.data[STORAGE_NAME].syncTime;
                return inputElementTime;
            },
        });

        // 打开客户端是否触发同步
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
        this.setting.addItem({
            title: "打开客户端是否同步",
            description: "打开客户端时是否触发文章同步任务",
            createActionElement: () => selectElementSync
        });
        selectElementSync.value = this.data[STORAGE_NAME].syncOnOpen ; // 设置默认值
        console.log("selectElementSync.value ",this.data[STORAGE_NAME].syncOnOpen);

        // 定时同步
        const selectTimeElement = document.createElement("select");
        selectTimeElement.className = "b3-select fn__size200";
        const options = [
            { value: "0", text: "关闭" },
            { value: "1", text: "1分钟" },
            { value: "5", text: "5分钟" },
            { value: "15", text: "15分钟" }
        ];
        options.forEach(option => {
            const optionTimeElement = document.createElement("option");
            optionTimeElement.value = option.value;
            optionTimeElement.text = option.text;
            selectTimeElement.appendChild(optionTimeElement);
        });
        this.setting.addItem({
            title: "自动保存间隔",
            description: "选择自动保存的时间间隔",
            createActionElement: () => selectTimeElement,
        });
        selectTimeElement.value = this.data[STORAGE_NAME].syncFrequency;


        // 同步一次
        const syncTask = document.createElement("button");
        syncTask.className = "b3-button b3-button--outline fn__flex-center fn__size200";
        syncTask.textContent = "同步一次";
        syncTask.addEventListener("click", () => {
            this.syncData();
        });
        this.setting.addItem({
            title: "同步一次",
            description: "同步一次~",
            createActionElement: () => syncTask,
        });

        // 跳转
        // const btnaElement = document.createElement("button");
        // btnaElement.className = "b3-button b3-button--outline fn__flex-center fn__size200";
        // btnaElement.textContent = "Open";
        // btnaElement.addEventListener("click", () => {
        //     window.open("https://github.com/siyuan-note/plugin-sample");
        // });
        // this.setting.addItem({
        //     title: "Open plugin url",
        //     description: "Open plugin url in browser",
        //     actionElement: btnaElement,
        // });

        // console.log(this.i18n.helloPlugin);

        // 启动定时任务
        this.startSyncInterval();
    }
    onLayoutReady() {
        this.loadData(STORAGE_NAME);
        console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
    }

    onunload() {
        console.log(this.i18n.byePlugin);
        this.stopSyncInterval();
    }

    uninstall() {
        console.log("uninstall");
        this.stopSyncInterval();
    }

    private startSyncInterval() {
        this.stopSyncInterval(); // 确保之前的定时任务被清除
        console.log("startSyncInterval")
        const syncFrequency = parseInt(this.data[STORAGE_NAME].syncFrequency, 10);
        console.log("syncFrequency=",syncFrequency)
        if (syncFrequency > 0) {
            this.syncIntervalId = window.setInterval(() => {
                console.log("执行定时任务")
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

    async syncData() {
        if (this.syncInProgress) {
            showMessage('藏趣云同步任务正在进行中，请稍后再试!');
            return;
        }

        this.syncInProgress = true;

        try {
            const apiKey = this.data[STORAGE_NAME].apiKey;
            if (!apiKey) {
                showMessage('API KEY 未设置');
                return;
            }

            await syncBookmarkData(this.app,this);
        } finally {
            this.syncInProgress = false;
        }
    }

    async updateSettings(settings: MyPluginSettings) {
        this.saveData(STORAGE_NAME, settings);
    }
}
