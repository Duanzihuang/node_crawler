var Crawler = require("crawler");
var mysql = require('mysql');

// 数据库参数
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'test'
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
            $(".layui-col-xs6").each((index, item) => {
                // 获取名字
                const name = $(item).find('.list-bottom h1').text()

                // 获取图片
                const imgURL = $(item).find('div.list-top img').attr('lay-src')

                const sql = `insert into t_model (model_name,model_pic) values ('${name}','http://gz.shat.cn${imgURL}')`
                connection.query(sql, (error, results, fields) => {
                    console.log("insert OK!")
                })
            })
            connection.end();
            done();
        }
    }
})
// Queue just one URL, with default callback
c.queue('http://gz.shat.cn/modellist?species=%E8%BD%A6%E5%B1%95%E6%A8%A1%E7%89%B9');
