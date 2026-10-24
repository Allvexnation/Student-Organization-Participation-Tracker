FROM php:8.2-apache

RUN docker-php-ext-install pdo pdo_mysql

RUN a2enmod rewrite

WORKDIR /var/www/html

COPY . /var/www/html/

RUN chown -R www-data:www-data /var/www/html
RUN chmod -R 755 /var/www/html

RUN echo "<VirtualHost *:80>" > /etc/apache2/sites-available/000-default.conf && \
    echo "    DocumentRoot /var/www/html" >> /etc/apache2/sites-available/000-default.conf && \
    echo "    <Directory /var/www/html/>" >> /etc/apache2/sites-available/000-default.conf && \
    echo "        Options Indexes FollowSymLinks" >> /etc/apache2/sites-available/000-default.conf && \
    echo "        AllowOverride All" >> /etc/apache2/sites-available/000-default.conf && \
    echo "        Require all granted" >> /etc/apache2/sites-available/000-default.conf && \
    echo "    </Directory>" >> /etc/apache2/sites-available/000-default.conf && \
    echo "    ErrorLog \${APACHE_LOG_DIR}/error.log" >> /etc/apache2/sites-available/000-default.conf && \
    echo "    CustomLog \${APACHE_LOG_DIR}/access.log combined" >> /etc/apache2/sites-available/000-default.conf && \
    echo "</VirtualHost>" >> /etc/apache2/sites-available/000-default.conf && \
    cat /etc/apache2/sites-available/000-default.conf

RUN echo '#!/bin/bash' > /var/www/html/start.sh && \
    echo 'echo "Running migrations..."' >> /var/www/html/start.sh && \
    echo 'php /var/www/html/migrate.php migrate' >> /var/www/html/start.sh && \
    echo 'echo "Running seeder..."' >> /var/www/html/start.sh && \
    echo 'php /var/www/html/AdminSeeder.php' >> /var/www/html/start.sh && \
    echo 'echo "Starting Apache..."' >> /var/www/html/start.sh && \
    echo 'apache2-foreground' >> /var/www/html/start.sh && \
    chmod +x /var/www/html/start.sh

EXPOSE 80

CMD ["/var/www/html/start.sh"]
