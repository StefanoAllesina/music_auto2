FROM node:8

# create app directory
WORKDIR /usr/src/app

# install app dependencies
# a wildcard is used to ensure both package.json AND package-lock.json
# are copied where available (npm@5+)
COPY package*.json ./

# update dependencies
RUN npm install
# if you are building code for production
# RUN npm ci --only=production

# install pip for python libraries
RUN apt-get update && apt-get install -y \
	python-pip \
	ghostscript \
	&& apt-get clean

# copy python requirements file and install them using pip
COPY python-reqs.txt .
RUN pip install -r python-reqs.txt

# bundle app source
COPY . .

EXPOSE 3000
CMD ["node", "index.js", "test/"]
