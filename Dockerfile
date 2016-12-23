FROM kkarczmarczyk/node-yarn:6.9

ENV NODE_ENV=production TERM=xterm

RUN apt-get update && apt-get install -y nano

RUN groupadd npmaddict && useradd --create-home --gid=npmaddict npmaddict
COPY . /home/npmaddict/npm-addict
WORKDIR /home/npmaddict/npm-addict
RUN chown --recursive npmaddict:npmaddict .
USER npmaddict

RUN yarn install --no-progress --no-emoji

ENTRYPOINT ["yarn", "start"]
