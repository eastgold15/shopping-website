import { Elysia, t } from "elysia";
import { ossService } from "./oss";
import { uploadModel, SUPPORTED_IMAGE_TYPES, MAX_FILE_SIZE, type UploadResponse } from './upload.model';
import { commonRes, errorRes } from '../plugins/Res';

export const uploadRoute = new Elysia({ prefix: '/upload', tags: ['Upload'] })
    .model(uploadModel)
    // 上传广告图片
    .post('/advertisement', async ({ body }) => {
        try {
            const formData = body as any;
            const file = formData.file;

            if (!file) {
                return errorRes(400, '没有上传文件');
            }

            // 验证文件类型
            if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
                return errorRes(400, '不支持的文件类型，请上传 JPG、PNG、GIF 或 WebP 格式的图片');
            }

            // 验证文件大小
            if (file.size > MAX_FILE_SIZE) {
                return errorRes(400, '文件大小不能超过 5MB');
            }

            // 读取文件内容并上传到OSS
            const fileBuffer = await file.arrayBuffer();
            const buffer = new Uint8Array(fileBuffer);

            const imageUrl = await ossService.uploadImage(
                buffer,
                'advertisements',
                file.name
            );

            // 返回文件URL
            return commonRes({
                url: imageUrl,
                fileName: file.name
            }, 200, '文件上传成功');
        } catch (error) {
            return errorRes(500, error instanceof Error ? error.message : '文件上传失败');
        }
    }, {
        body: 'FileUploadDto',
        detail: {
            tags: ['Upload'],
            summary: '上传广告图片',
            description: '上传广告图片到OSS存储'
        }
    })

    // 上传商品图片
    .post('/product', async ({ body }) => {
        try {
            const formData = body as any;
            const files = formData.file;

            if (!files) {
                return errorRes(400, '没有上传文件');
            }

            // 处理单个文件或多个文件，统一转换为数组
            const fileArray = Array.isArray(files) ? files : [files];
            const uploadResults = [];

            for (const file of fileArray) {
                // 验证文件类型
                if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
                    return errorRes(400, `文件 ${file.name} 不支持的文件类型，请上传 JPG、PNG、GIF 或 WebP 格式的图片`);
                }

                // 验证文件大小
                if (file.size > MAX_FILE_SIZE) {
                    return errorRes(400, `文件 ${file.name} 大小不能超过 5MB`);
                }

                // 读取文件内容并上传到OSS
                const fileBuffer = await file.arrayBuffer();
                const buffer = new Uint8Array(fileBuffer);

                const imageUrl = await ossService.uploadImage(
                    buffer,
                    'products',
                    file.name
                );

                uploadResults.push({
                    url: imageUrl,
                    fileName: file.name
                });
            }

            // 返回文件URL数组
            return commonRes({
                urls: uploadResults.map(result => result.url),
                files: uploadResults
            }, 200, `成功上传 ${uploadResults.length} 个文件`);
        } catch (error) {
            return errorRes(500, error instanceof Error ? error.message : '文件上传失败');
        }
    }, {
        body: 'FileUploadDto',
        detail: {
            tags: ['Upload'],
            summary: '上传商品图片',
            description: '上传商品图片到OSS存储'
        }
    })

    // 上传分类图片
    .post('/category', async ({ body }) => {
        try {
            const formData = body as any;
            const file = formData.file;

            if (!file) {
                return errorRes(400, '没有上传文件');
            }

            // 验证文件类型
            if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
                return errorRes(400, '不支持的文件类型，请上传 JPG、PNG、GIF 或 WebP 格式的图片');
            }

            // 验证文件大小
            if (file.size > MAX_FILE_SIZE) {
                return errorRes(400, '文件大小不能超过 5MB');
            }

            // 读取文件内容并上传到OSS
            const fileBuffer = await file.arrayBuffer();
            const buffer = new Uint8Array(fileBuffer);

            const imageUrl = await ossService.uploadImage(
                buffer,
                'categories',
                file.name
            );

            // 返回文件URL
            return commonRes({
                url: imageUrl,
                fileName: file.name
            }, 200, '文件上传成功');
        } catch (error) {
            return errorRes(500, error instanceof Error ? error.message : '文件上传失败');
        }
    }, {
        body: 'FileUploadDto',
        detail: {
            tags: ['Upload'],
            summary: '上传分类图片',
            description: '上传分类图片到OSS存储'
        }
    })

    // 上传通用图片
    .post('/general', async ({ body }) => {
        try {
            const formData = body as any;
            const file = formData.file;
            const folder = formData.folder || 'general';

            if (!file) {
                return errorRes(400, '没有上传文件');
            }

            // 验证文件类型
            if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
                return errorRes(400, '不支持的文件类型，请上传 JPG、PNG、GIF 或 WebP 格式的图片');
            }

            // 验证文件大小
            if (file.size > MAX_FILE_SIZE) {
                return errorRes(400, '文件大小不能超过 5MB');
            }

            // 读取文件内容并上传到OSS
            const fileBuffer = await file.arrayBuffer();
            const buffer = new Uint8Array(fileBuffer);

            const imageUrl = await ossService.uploadImage(
                buffer,
                folder,
                file.name
            );

            // 返回文件URL
            return commonRes({
                url: imageUrl,
                fileName: file.name
            }, 200, '文件上传成功');
        } catch (error) {
            return errorRes(500, error instanceof Error ? error.message : '文件上传失败');
        }
    }, {
        body: 'FileUploadDto',
        detail: {
            tags: ['Upload'],
            summary: '上传通用图片',
            description: '上传通用图片到OSS存储'
        }
    })