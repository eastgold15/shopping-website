import { Elysia } from 'elysia';

import { ossModel } from './oss.model';
import { ossService } from './oss.service';
import { commonRes } from '@backend/utils/Res';

/**
 * OSS 控制器
 * 处理 OSS 相关的HTTP请求
 */
export const ossController = new Elysia({ prefix: '/oss' })
  .model(ossModel)
  .decorate('ossService', ossService)
  .guard({
    detail: {
      tags: ['OSS']
    }
  })

  // // 获取预签名上传URL
  // .post('/presigned-url', async ({ body, ossService }) => {
  //   const result = await ossService.getPresignedUrl(body.key, body.contentType, body.expires);

  //   if (!result.success) {
  //     return {
  //       success: false,
  //       error: result.error?.message || '获取预签名URL失败'
  //     };
  //   }

  //   return commonRes(result.data);
  // }, {
  //   body: 'uploadParams',
  //   detail: {
  //     summary: '获取预签名上传URL',
  //     description: '获取用于直接上传到OSS的预签名URL'
  //   }
  // })

  // 删除文件
  .delete('/file', async ({ body, ossService }) => {
    const result = await ossService.deleteFile(body.key);


    return commonRes({ success: true });
  }, {
    body: 'deleteParams',
    detail: {
      summary: '删除文件',
      description: '从OSS中删除指定文件'
    }
  })

  // 批量删除文件
  .delete('/files', async ({ body, ossService }) => {
    const result = await ossService.batchDeleteFiles(body.keys);

    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || '批量删除文件失败'
      };
    }

    return commonRes(result.data);
  }, {
    body: 'batchDeleteParams',
    detail: {
      summary: '批量删除文件',
      description: '从OSS中批量删除多个文件'
    }
  })

  // 检查文件是否存在
  .post('/file/exists', async ({ body, ossService }) => {
    const result = await ossService.fileExists(body.key);

    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || '检查文件存在性失败'
      };
    }

    return commonRes({ exists: result.data });
  }, {
    body: 'existsParams',
    detail: {
      summary: '检查文件是否存在',
      description: '检查OSS中指定文件是否存在'
    }
  })

  // 获取文件信息
  .post('/file/info', async ({ body, ossService }) => {
    const result = await ossService.getFileInfo(body.key);

    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || '获取文件信息失败'
      };
    }

    return commonRes(result.data);
  }, {
    body: 'existsParams',
    detail: {
      summary: '获取文件信息',
      description: '获取OSS中指定文件的详细信息'
    }
  })

  // 列出文件
  .post('/files/list', async ({ body, ossService }) => {
    const result = await ossService.listFiles(body.prefix, body.maxKeys, body.marker);

   

    return commonRes(result.data);
  }, {
    body: 'listParams',
    detail: {
      summary: '列出文件',
      description: '获取OSS中指定前缀的文件列表'
    }
  });