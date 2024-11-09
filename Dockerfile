# Folosim Node.js versiunea LTS
FROM node:18-alpine

# Setăm directorul de lucru
WORKDIR /app

# Copiem package.json și package-lock.json
COPY package*.json ./

# Instalăm dependențele
RUN npm ci

# Copiem restul codului sursă
COPY . .

# Creăm directoarele necesare pentru avatare și fișiere temporare
RUN mkdir -p public/avatars tmp && \
    chmod 777 public/avatars tmp

# Expunem portul pe care va rula aplicația
EXPOSE 3000

# Setăm variabilele de mediu implicite
ENV NODE_ENV=production \
    PORT=3000

# Comanda de pornire a aplicației
CMD ["npm", "start"]