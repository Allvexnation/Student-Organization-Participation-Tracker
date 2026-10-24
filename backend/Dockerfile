FROM php:8.2-apache

RUN docker-php-ext-install pdo pdo_mysql

RUN a2enmod rewrite

WORKDIR /var/www/html

COPY . /var/www/html/

RUN chown -R www-data:www-data /var/www/html
RUN chmod -R 755 /var/www/html

RUN echo "DirectoryIndex index.php" > /etc/apache2/mods-available/dir.conf
RUN echo "<Directory /var/www/html>" >> /etc/apache2/mods-available/dir.conf
RUN echo "    AllowOverride All" >> /etc/apache2/mods-available/dir.conf
RUN echo "    Require all granted" >> /etc/apache2/mods-available/dir.conf
RUN echo "</Directory>" >> /etc/apache2/mods-available/dir.conf

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
