FROM python:3.9

WORKDIR /app/backend

# Install curl and download wait-for-it.sh
RUN apt-get update && apt-get install -y curl \
    && curl -o /app/backend/wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh \
    && chmod +x /app/backend/wait-for-it.sh

# Copy the necessary files
COPY requirements.txt /app/backend

# Install system dependencies
RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y gcc default-libmysqlclient-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install mysqlclient
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . /app/backend

# Expose the application port
EXPOSE 8000