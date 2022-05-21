// 绑定kv命名空间，变量名为 bar
// Config
var host = "yourhost"

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  
  url = new URL(request.url)
  //console.log(url.pathname)
  if(url.pathname.startsWith("/gen")){
    // console.log('gen')
    let info = await request.json()
    let exp = parseInt(info.expTime)>=60?parseInt(info.expTime):60
    // 随机字符串
    var timestamp=new Date().getTime() + exp * 1000 //info.expTime秒后过期
    //console.log(timestamp)
    key = CODE.encode((timestamp-1653136486429).toString())
    console.log(key)
    // 存储值
    await bar.put(key,info.content,{expiration: timestamp/1000})
    // 反馈链接
    // console.log(info.content)
    // console.log("将在"+exp.toString()+"秒后过期")
    // console.log("https://"+host+"/read?key="+key)
    htmlContent = `
    将在${exp.toString()}秒后到期，您可以复制链接发送给您的好友<br><b>https://${host}/read?key=${key}</b>
    `
    return new Response(htmlContent)
  }
  if(url.pathname.startsWith("/read")){
    // 验证时间有效性
    // console.log('read')
    // 删除或者读出
    // console.log(url.search)
    // console.log(url.search.indexOf("key="))
    let key= decodeURIComponent(url.search.slice(url.search.indexOf("key=")+4))
    content = `<div style='padding:70px 0'>查看后立即销毁
    <button onclick="look()">查看</button></div>
    <script>
      function look(){
            var formData = JSON.stringify({
              "key":"${key}"
            })
            $.ajax({
                type: "POST",
                url: "/fetch",
                data: formData,
                success: function(result){
                    $("body").html(result)
                }
           });
    }
    
    </script>
    `
    return new Response(genHtml(content),{headers:{
                    'content-type':'text/html; charset=utf-8',
                    'Cache-control': 'no-cache'
                 }})
  }
  if(url.pathname.startsWith("/fetch")){//
    let info = await request.json()
    value = await bar.get(info.key)
    value = value?`<div style='padding:70px 0'>${value}</div>`:"<div style='padding:70px 0;color:red;'>资源不存在或已经被焚毁</div>"
    await bar.delete(info.key)
    return new Response(value)
  }
  return new Response(genHtml(indexHtmlBody),{headers:{
                    'content-type':'text/html; charset=utf-8'
                 }})
}

var CODE={
  enKey: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=', 
  deKey: new Array(
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
    -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
    -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1
  ),
   
  encode: function(src){
    //用一个数组来存放编码后的字符，效率比用字符串相加高很多。
    var str=new Array();
    var ch1, ch2, ch3;
    var pos=0;
    //每三个字符进行编码。
    while(pos+3<=src.length){
      ch1=src.charCodeAt(pos++);
      ch2=src.charCodeAt(pos++);
      ch3=src.charCodeAt(pos++);
      str.push(this.enKey.charAt(ch1>>2), this.enKey.charAt(((ch1<<4)+(ch2>>4))&0x3f));
      str.push(this.enKey.charAt(((ch2<<2)+(ch3>>6))&0x3f), this.enKey.charAt(ch3&0x3f));
    }
    //给剩下的字符进行编码。
    if(pos<src.length){
      ch1=src.charCodeAt(pos++);
      str.push(this.enKey.charAt(ch1>>2));
      if(pos<src.length){
        ch2=src.charCodeAt(pos);
        str.push(this.enKey.charAt(((ch1<<4)+(ch2>>4))&0x3f));
        str.push(this.enKey.charAt(ch2<<2&0x3f), '=');
      }else{
        str.push(this.enKey.charAt(ch1<<4&0x3f), '==');
      }
    }
    //组合各编码后的字符，连成一个字符串。
    return str.join('');
  },
   
  decode: function(src){
    //用一个数组来存放解码后的字符。
    var str=new Array();
    var ch1, ch2, ch3, ch4;
    var pos=0;
    //过滤非法字符，并去掉'='。
    src=src.replace(/[^A-Za-z0-9\+\/]/g, '');
    //decode the source string in partition of per four characters.
    while(pos+4<=src.length){
      ch1=this.deKey[src.charCodeAt(pos++)];
      ch2=this.deKey[src.charCodeAt(pos++)];
      ch3=this.deKey[src.charCodeAt(pos++)];
      ch4=this.deKey[src.charCodeAt(pos++)];
      str.push(String.fromCharCode(
        (ch1<<2&0xff)+(ch2>>4), (ch2<<4&0xff)+(ch3>>2), (ch3<<6&0xff)+ch4));
    }
    //给剩下的字符进行解码。
    if(pos+1<src.length){
      ch1=this.deKey[src.charCodeAt(pos++)];
      ch2=this.deKey[src.charCodeAt(pos++)];
      if(pos<src.length){
        ch3=this.deKey[src.charCodeAt(pos)];
        str.push(String.fromCharCode((ch1<<2&0xff)+(ch2>>4), (ch2<<4&0xff)+(ch3>>2)));
      }else{
        str.push(String.fromCharCode((ch1<<2&0xff)+(ch2>>4)));
      }
    }
    //组合各解码后的字符，连成一个字符串。
    return str.join('');
  }
};
function genHtml(htmlContent){ 
  return  `
  <!doctype html>
  <html>
  <head>
  <script src="https://lib.sinaapp.com/js/jquery/2.0.2/jquery-2.0.2.min.js"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=1">
  <meta http-equiv="content-type" content="txt/html; charset=utf-8" />
  <title>Burn After Reading</title>
  <style>
  html, body {
    height: 100%;
  }

  </style>
  </head>
  <body style="text-align:center">
  ${htmlContent}
  </body>
  </html>
  `
}
indexHtmlBody = `
    <h3>欢迎使用阅后即焚</h3>
    <i>有效期过后也会自动焚毁</i><br>
    <textarea name="content" style="width: 80%;" rows="5"></textarea><br>
    有效时间：
    <select name="expTime">
        <option value=60>1分钟</option>
        <option value=120 selected>2分钟</option>
        <option value=300>5分钟</option>
        <option value=600>10分钟</option>
        <option value=1800>30分钟</option>
        <option value=3600>1小时</option>
    </select><br>
    <button onclick="submitForm()" style="width: 6em;height: 2em;margin-top: 1em;">立即生成</button>
    <br><br>
    <div id="result">
    </div>
    <script>
        function submitForm(){
            var formData = JSON.stringify({
                "expTime":$("select[name='expTime']").val(),
                "content":$("textarea[name='content']").val()
            })
            console.log(formData)
            $.ajax({
                type: "POST",
                url: "/gen",
                data: formData,
                success: function(result){
                    $("#result").html(result)
                }
           });
    }
    </script>
`
