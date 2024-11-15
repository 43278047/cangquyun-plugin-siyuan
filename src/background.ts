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
    Custom, exitSiYuan, getModelByDockType, getAllEditor, Files, platformUtils,fetchSyncPost, IWebSocketData
} from "siyuan";

import {getBookmarkContentList} from './api';
import {renderTemplate} from "./template";
import CangQuYunPlugin from "./index";
import Utils from "./utils";
import {config} from "./config";
const STORAGE_NAME = config.STORAGE_NAME;

const pageSize = 50;

// 同步函数
async function syncBookmarkData(app: any, plugin: CangQuYunPlugin): Promise<void> {

    showMessage('🚀 藏趣云 开始同步');
    let pageNum = 1;
    let count = 0;
    let startTime = '';
    let syncTime: string = '';
    let newSyncTime = Utils.getCurrentBeijingTime();
    let template = '';
    let apiKey = '';
    let defaultDirectory = '';
    try {

        let settings = plugin.data[STORAGE_NAME];
        syncTime = settings.syncTime;
        template = settings.template;
        apiKey = settings.apiKey;
        defaultDirectory = settings.defaultDirectory;
        if (!defaultDirectory) {
            defaultDirectory = 'cangquyun';
        }
        if (syncTime){
            try {
               startTime = Utils.dateTimeStringToTimestamp(syncTime);
            }catch (e) {
               startTime = '';
            }
        }
    } catch (error) {
        showMessage('同步失败：时间格式错误，请检查时间格式是否为yyyy-MM-dd HH:mm:ss');
        return;
    }

    // 创建目录
   let defaultDirectoryId =  await createDirectory( defaultDirectory);

    try {
        // 无限循环的翻页至到 response.data = []
        while (true) {
            const response = await getBookmarkContentList(apiKey, pageNum, pageSize, startTime);
            if (response.code == 200) {
                if (response.data.length === 0) {
                    await updateSyncTime(plugin, newSyncTime);
                    showMessage('🎉 藏趣云 已完成同步!');
                    return;
                }
                count += response.data.length;
                await bookmarkListWriteFile(defaultDirectoryId, response.data, template);
                if (response.data.length < pageSize){
                    await updateSyncTime(plugin, newSyncTime);
                    showMessage('🎉 藏趣云 已完成同步!');
                    return;
                }
            } else {
                showMessage(`同步失败：` + response.msg);
                return;
            }
            pageNum++;
        }
    } catch (error) {
        showMessage('同步中断：系统异常请稍后再试');
        console.error('Error fetching bookmark content:', error);
        return;
    }


}
async function updateSyncTime(plugin: CangQuYunPlugin, newSyncTime: string){
    let settings = plugin.data[STORAGE_NAME];
    // 设置为当前北京时间
    settings.syncTime = newSyncTime;
    await plugin.updateSettings(settings);
}

async function bookmarkListWriteFile(defaultDirectoryId: string,  bookmarkContentList: any[], template: string): Promise<string> {
    for (const bookmarkContent of bookmarkContentList) {
        if (bookmarkContentList.length === 0) {
            continue;
        }
        const [year, month, day] = bookmarkContent.createTime.substring(0, 10).split('-');

        const directoryPath =`/${year}/${month}/${day}/`;

        // 创建文件
        const cleanedFileName = Utils.cleanFileName(bookmarkContent.title) + '.md';
        const filePath = directoryPath + cleanedFileName;
        // 模板
        const markdownContent = renderTemplate(template, bookmarkContent);
        if (!markdownContent) {
            continue;
        }
        await createFile(defaultDirectoryId, filePath, markdownContent);
    }
    return 'success'; // 返回一个字符串表示操作成功
}

// 创建笔记本
async function createDirectory( directoryPath: string): Promise<string> {

     let noteBook:IWebSocketData = await fetchSyncPost('/api/notebook/createNotebook', {
        "name": directoryPath
    })
    return noteBook.data.notebook.id;

    // if (!await vault.adapter.exists(directoryPath)) {
    //     await vault.createFolder(directoryPath);
    // }
}

// 创建文件并写入内容
async function createFile(notebookId: string, filePath: string, content: string): Promise<void> {
    console.log("createFile ="+filePath);
    await fetchSyncPost('/api/filetree/createDocWithMd', {
        "notebook": notebookId,
        "path": filePath ,
        "markdown": content
    })

    // // 如果文件存在，先获取文件对象并删除它
    // if (await vault.adapter.exists(filePath)) {
    //     const file = vault.getAbstractFileByPath(filePath);
    //     if (file) {
    //         await vault.delete(file);
    //     }
    // }
    // // 创建新的文件并写入内容
    // await vault.create(filePath, content);
}


export {syncBookmarkData};
