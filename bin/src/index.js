"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const twitter_api_v2_1 = require("twitter-api-v2");
const config_json_1 = require("../config.json");
const axios_1 = __importDefault(require("axios"));
const twitterClient = new twitter_api_v2_1.TwitterApi(config_json_1.Bearer_token);
const client = twitterClient.readOnly;
let userid;
userid = '1491856273582673926';
const getLikedTweetsDatas = (userid) => __awaiter(void 0, void 0, void 0, function* () {
    let tweets = [];
    let next_token = null;
    for (let i = 0; i < 20; i++) {
        const result = yield getLikedTweetsData(userid, next_token);
        tweets = tweets.concat(result.tweets);
        next_token = result.next_token;
    }
    return tweets;
});
const getLikedTweetsData = (userid, next_token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const url = `users/${userid}/liked_tweets`;
        const options = {
            max_results: 100,
            "expansions": "attachments.media_keys,author_id",
            "media.fields": "url,media_key"
        };
        if (next_token) {
            options.pagination_token = next_token;
        }
        const response = yield client.v2.get(url, options);
        const data = response.data;
        const meta = response.meta;
        const includes_media = response.includes.media;
        const includes_users = response.includes.users;
        const tweets = [];
        data.forEach((data) => {
            const user = includes_users.find((user) => user.id == data.author_id);
            const url = data.text.split(' ').slice(-1)[0];
            const medias = [];
            if (data.attachments) {
                data.attachments.media_keys.forEach((media_key) => {
                    const media = includes_media.find((media) => media.media_key == media_key);
                    medias.push(media.url);
                });
            }
            tweets.push({ url, name: user.name, username: user.username, id: data.id, medias });
        });
        return { tweets, next_token: meta.next_token };
        //[이미지 하나]
        // 포함될 정보: 글 url, 유저 닉네임(@유저 고닉) x, 트위터 로고
        // 이름: 글 url x
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
});
const makeJson = (fileDir, filename, mediadata) => {
    try {
        const json = JSON.stringify(mediadata, null, 2);
        if (!fs_1.default.existsSync(fileDir)) {
            fs_1.default.mkdirSync(fileDir);
        }
        fs_1.default.writeFileSync(`${fileDir}/${filename}.json`, json);
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
};
const downloadImage = (url, fileDir, filename) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filenameExtension = url.split('.').slice(-1)[0];
        const path = `${fileDir}/${filename}.${filenameExtension}`;
        const response = yield axios_1.default.get(url, { responseType: 'stream' });
        if (!fs_1.default.existsSync(fileDir)) {
            fs_1.default.mkdirSync(fileDir);
        }
        yield response.data.pipe(fs_1.default.createWriteStream(path));
        return path;
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
});
const app = () => __awaiter(void 0, void 0, void 0, function* () {
    const likedTweetsData = yield getLikedTweetsDatas(userid);
    const timestamp = Date.now();
    const fileDir = `./out/${userid}_${timestamp}`;
    makeJson(fileDir, 'info', likedTweetsData);
    likedTweetsData.forEach((tweet, dataIndex) => {
        if (tweet.medias.length < 1) {
            return;
        }
        tweet.medias.forEach((mediaUrl, mediaIndex) => {
            if (!mediaUrl) {
                return;
            }
            downloadImage(mediaUrl, fileDir, `${dataIndex + 1}_${mediaIndex + 1}`);
        });
    });
    console.log("Success!");
    process.exit(0);
});
app();
