FROM oven/bun:1.2.20-alpine AS build

WORKDIR /app

COPY . .
RUN bun install
# 复制源代码和配置文件

# 设置生产环境
ENV NODE_ENV=production
RUN bun run  build:exe:prod





# 复制编译后的文件到新的镜像中
FROM oven/bun:1.2.20-alpine
WORKDIR /app

COPY --from=build /app/dist.exe ./dist.exe
# 创建目录并复制环境配置文件
RUN mkdir -p .container/prod
COPY --from=build /app/.container/prod/* ./.container/prod/
# 复制根目录的 .env 文件（如果存在）
COPY --from=build /app/.env* ./
# 复制 public 目录
COPY --from=build /app/public ./public

# 设置生产环境变量
ENV NODE_ENV=production

CMD ["./dist.exe"]
EXPOSE $APP_PORT
