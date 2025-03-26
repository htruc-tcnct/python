# Sử dụng image node chính thức
FROM node:18-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app/client

# Copy file package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Build ứng dụng React
RUN npm run build

# Expose port mà ứng dụng chạy
EXPOSE 3000

# Lệnh chạy ứng dụng
CMD ["npm", "start"]