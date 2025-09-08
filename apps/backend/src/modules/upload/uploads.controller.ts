import { Elysia } from 'elysia';

import { uploadsModel } from './uploads.model';
import { uploadService } from './uploads.service';

/**
 * 文件上传控制器
 * 处理文件上传相关的HTTP请求
 */
export const uploadsController = new Elysia({ prefix: '/upload' })
  .model(uploadsModel)
  .guard({
    detail: {
      tags: ['Upload']
    }
  })

  // 上传通用图片
  .post('/general', async ({ body: { file, folder = 'general' } }) => {
    const result = await uploadService.uploadGeneralFile(file, folder);
    return result
  }, {
    body: 'GeneralFileUploadDto',
    detail: {
      summary: '上传通用图片',
      description: '上传通用图片到指定文件夹'
    }
  })

  // 删除文件
  .delete('/file', async ({ query }) => {
    const { url } = query;



    const result = await uploadService.deleteFile(url);


    return result
  }, {
    detail: {
      summary: '删除文件',
      description: '根据URL删除OSS中的文件'
    }
  })

  // 检查文件是否存在
  .get('/file/exists', async ({ query }) => {
    const { url } = query;

    if (!url) {
      return {
        success: false,
        error: '文件URL不能为空'
      };
    }

    const result = await uploadService.fileExists(url);


    return result
  }, {
    detail: {
      summary: '检查文件是否存在',
      description: '检查指定URL的文件是否存在'
    }
  })

  // 获取文件信息
  .get('/file/info', async ({ query }) => {
    const { url } = query;

    if (!url) {
      return {
        success: false,
        error: '文件URL不能为空'
      };
    }

    const result = await uploadService.getFileInfo(url);


    return result
  }, {
    detail: {
      summary: '获取文件信息',
      description: '获取指定URL文件的详细信息'
    }
  });