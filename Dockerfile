FROM php:8.2-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    nodejs \
    npm \
    && apt-get clean

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Set working directory
WORKDIR /app

# Copy everything
COPY . .

# Build frontend
RUN cd Frontend && npm ci && npm run build && \
    mkdir -p ../Backend/public/frontend && \
    mv -f dist/* ../Backend/public/frontend/

# Install PHP dependencies
RUN cd Backend && composer install --no-dev --optimize-autoloader

# Expose port
EXPOSE 8080

# Start command
CMD cd Backend && php artisan serve --host=0.0.0.0 --port=${PORT:-8080}