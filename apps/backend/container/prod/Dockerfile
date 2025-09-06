FROM oven/bun AS build

WORKDIR /app

COPY . .
RUN bun install
# 复制源代码和配置文件

# 设置生产环境
ENV NODE_ENV=production
RUN bun run  build





# 复制编译后的文件到新的镜像中
FROM gcr.io/distroless/base
WORKDIR /app

COPY --from=build /app/server ./server

# # 创建目录并复制环境配置文件
# RUN mkdir -p .container/prod
# COPY --from=build /app/.container/prod/* ./.container/prod/
# # 复制根目录的 .env 文件（如果存在）
# COPY --from=build /app/.env* ./
# # 复制 public 目录
# COPY --from=build /app/public ./public

# 设置生产环境变量
ENV NODE_ENV=production

CMD ["./server"]
EXPOSE $APP_PORT
