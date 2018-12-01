const Crawler = require("crawler");
const mysql = require("mysql");
const querystring = require("querystring");
const fs = require("fs");
const path = require("path");

// 数据库参数
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "test"
});

// 连接数据库
connection.connect();

var c = new Crawler({
  maxConnections: 10,
  // This will be called for each crawled page
  callback: function(error, res, done) {
    if (error) {
      console.log(error);
    } else {
      var $ = res.$;
      // $ is Cheerio by default
      //a lean implementation of core jQuery designed specifically for the server
      $(".layui-col-xs6").each((index, element) => {
        // 获取名字
        const name = $(element)
          .find(".list-bottom h1")
          .text();

        // 获取图片
        let imgURL = $(element)
          .find("div.list-top img")
          .attr("lay-src");
        imgURL = `http://gz.shat.cn${imgURL}`;

        let detailURL = $(element)
          .find(".list-top a")
          .attr("href");

        detailURL = `http://gz.shat.cn/models?name=${querystring.escape(name)}`;

        // 保存图片
        cImg.queue({
          uri: imgURL,
          filename: `${path.join(__dirname, "images")}/${name}.jpg`
        });

        // 爬取二级页面
        c2.queue(detailURL);
      });
      done();
    }
  }
});
// Queue just one URL, with default callback
c.queue(
  "http://gz.shat.cn/modellist?species=%E5%B9%B3%E9%9D%A2%E6%A8%A1%E7%89%B9"
);

var c2 = new Crawler({
  maxConnections: 10,
  // This will be called for each crawled page
  callback: function(error, res, done) {
    if (error) {
      console.log(error);
    } else {
      var $ = res.$;

      // 新建一个模特对象
      const model = {};

      // 获取封面图片
      let imgURL = $(".portrait img").attr("src");
      imgURL = `http://gz.shat.cn${imgURL}`;

      let label = $(".model-lable a").text();

      // 获取详细信息
      model["model_pic"] = imgURL;
      model["label"] = label;
      $(".model-data li").each((index, element) => {
        let key = $(element)
          .find("em")
          .text();
        key = key.substring(0, key.length - 1);

        let value = $(element)
          .find("p")
          .text();

        model[key] = value;
      });

      // 图片列表
      const pics = [];
      $(".model-images img").each((index, imgEle) => {
        pics.push("http://gz.shat.cn" + $(imgEle).attr("lay-src"));
      });
      model["pics"] = pics.join(" ");

      // 保存到数据库中
      let sql = `insert into t_model (`;
      for (const key in model) {
        sql += `${key},`;
      }

      sql = sql.substring(0, sql.length - 1);

      sql += ") values (";

      for (const key in model) {
        sql += `'${model[key]}',`;
      }

      sql = sql.substring(0, sql.length - 1);

      sql += ")";

      connection.query(sql, (error, results, fields) => {
        console.log("insert OK!");
      });
    }
    done();
  }
});

var cImg = new Crawler({
  encoding: null,
  jQuery: false, // set false to suppress warning message.
  callback: function(err, res, done) {
    if (err) {
      console.error(err.stack);
    } else {
      fs.createWriteStream(res.options.filename).write(res.body);
    }

    done();
  }
});
